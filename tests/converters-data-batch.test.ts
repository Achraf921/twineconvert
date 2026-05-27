/**
 * Tier 1 data batch (2026-05-27): vcf-to-xlsx, ics-to-xlsx, xml-to-csv,
 * csv-to-html.
 *
 * Non-shallow integrity, not "did it throw / did the blob exist":
 *   - xlsx outputs are re-opened with SheetJS, row count == input record
 *     count, specific values in named columns
 *   - xml-to-csv output is re-parsed with Papa, row count + cell value
 *     assertions, both the repeated-element detection AND the multi-row
 *     scenarios are covered
 *   - csv-to-html is re-parsed with a tiny tag scanner, row count matches
 *     input, HTML entities in cell values are properly escaped (XSS guard)
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";

async function xlsxTable(blob: Blob): Promise<{
  header: string[];
  records: Record<string, string>[];
}> {
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default ?? XLSXModule;
  const buf = new Uint8Array(await blob.arrayBuffer());
  // PK zip magic — xlsx is a zip container.
  expect(buf[0]).toBe(0x50);
  expect(buf[1]).toBe(0x4b);
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    blankrows: false,
  });
  const [header, ...rows] = aoa;
  const records = rows.map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[String(h)] = r[i] != null ? String(r[i]) : ""));
    return o;
  });
  return { header: header.map(String), records };
}

describe("data-batch: vcf-to-xlsx", () => {
  it("every contact survives with email / phone / org in named columns", async () => {
    const { parseVcard } = await import("../src/lib/engine/util/vcard");
    const expected = parseVcard(FIXTURES.vcard);
    expect(expected.length).toBeGreaterThan(1);

    const result = await run(
      "vcf-to-xlsx",
      fileFromText("c.vcf", FIXTURES.vcard, "text/vcard"),
    );
    expect(result.blob.type).toContain("spreadsheetml");
    const { header, records } = await xlsxTable(result.blob);
    expect(records.length).toBe(expected.length);
    expect(header).toContain("email");
    expect(header).toContain("phone");
    expect(header).toContain("organization");
    const john = records.find((r) => r.fullName === "John Smith");
    expect(john).toBeDefined();
    expect(john!.email).toBe("john@acme.example");
    expect(john!.organization).toBe("Acme Inc");
  });

  it("rejects a non-vCard input with an actionable error", async () => {
    await expect(
      run("vcf-to-xlsx", fileFromText("x.vcf", "not vcard text", "text/vcard")),
    ).rejects.toThrow(/no contacts found/i);
  });
});

describe("data-batch: ics-to-xlsx", () => {
  it("every event survives with summary / location / start in the right columns", async () => {
    const { parseIcal } = await import("../src/lib/engine/util/ical");
    const expected = parseIcal(FIXTURES.ics);
    expect(expected.length).toBeGreaterThan(1);

    const result = await run(
      "ics-to-xlsx",
      fileFromText("c.ics", FIXTURES.ics, "text/calendar"),
    );
    const { header, records } = await xlsxTable(result.blob);
    expect(records.length).toBe(expected.length);
    expect(header).toContain("summary");
    expect(header).toContain("start");
    expect(header).toContain("location");
    const kickoff = records.find((r) => r.summary === "Project kickoff");
    expect(kickoff).toBeDefined();
    expect(kickoff!.location).toBe("Room 4B");
    const holiday = records.find((r) => r.summary === "Company holiday");
    expect(holiday).toBeDefined();
    expect(holiday!.allDay).toBe("true");
  });

  it("rejects a calendar with no VEVENT blocks", async () => {
    await expect(
      run(
        "ics-to-xlsx",
        fileFromText("x.ics", "BEGIN:VCALENDAR\nEND:VCALENDAR\n", "text/calendar"),
      ),
    ).rejects.toThrow(/no events found/i);
  });
});

describe("data-batch: xml-to-csv", () => {
  it("detects the repeating element and flattens scalar children to columns", async () => {
    const xml =
      "<orders>" +
      "<order><id>1</id><total>9.99</total><currency>USD</currency></order>" +
      "<order><id>2</id><total>19.50</total><currency>EUR</currency></order>" +
      "<order><id>3</id><total>5.25</total><currency>GBP</currency></order>" +
      "</orders>";
    const result = await run(
      "xml-to-csv",
      fileFromText("orders.xml", xml, "application/xml"),
    );
    expect(result.blob.type).toContain("csv");
    const Papa = (await import("papaparse")).default;
    const text = await result.blob.text();
    const parsed = Papa.parse<Record<string, string>>(text.trim(), {
      header: true,
    });
    expect(parsed.data.length).toBe(3);
    expect(parsed.data[0].id).toBe("1");
    expect(parsed.data[0].total).toBe("9.99");
    expect(parsed.data[2].currency).toBe("GBP");
  });

  it("rejects XML with no repeating element with an actionable error", async () => {
    await expect(
      run(
        "xml-to-csv",
        fileFromText("flat.xml", "<root><single>x</single></root>", "application/xml"),
      ),
    ).rejects.toThrow(/repeating element/i);
  });

  it("handles attributes: emits @_ prefixed columns alongside element columns", async () => {
    const xml =
      "<rows>" +
      '<row id="a"><name>Alice</name></row>' +
      '<row id="b"><name>Bob</name></row>' +
      "</rows>";
    const result = await run(
      "xml-to-csv",
      fileFromText("rows.xml", xml, "application/xml"),
    );
    const Papa = (await import("papaparse")).default;
    const text = await result.blob.text();
    const parsed = Papa.parse<Record<string, string>>(text.trim(), {
      header: true,
    });
    expect(parsed.data.length).toBe(2);
    expect(parsed.data[0].name).toBe("Alice");
    expect(parsed.data[0]["@_id"]).toBe("a");
  });
});

describe("data-batch: csv-to-html", () => {
  it("renders a real HTML table with the right row count", async () => {
    const csv = "id,name,city\n1,Alice,Paris\n2,Bob,Tokyo\n3,Carol,Lima\n";
    const result = await run(
      "csv-to-html",
      fileFromText("rows.csv", csv, "text/csv"),
    );
    expect(result.blob.type).toContain("html");
    const html = await result.blob.text();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<table>");
    // 1 header row + 3 body rows
    expect((html.match(/<tr>/g) ?? []).length).toBe(4);
    expect(html).toMatch(/<th>name<\/th>/);
    expect(html).toMatch(/<td>Alice<\/td>/);
    expect(html).toMatch(/<td>Lima<\/td>/);
  });

  it("escapes HTML entities in cell values (XSS guard)", async () => {
    // If escaping is broken this row would inject a real <script> tag.
    const csv = "name,note\n<b>Hi</b>,\"<script>alert(1)</script>\"\n";
    const result = await run(
      "csv-to-html",
      fileFromText("evil.csv", csv, "text/csv"),
    );
    const html = await result.blob.text();
    expect(html).not.toMatch(/<script>/i);
    expect(html).toContain("&lt;b&gt;Hi&lt;/b&gt;");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("inherits the systemic delimiter sniff (semicolon CSV still works)", async () => {
    const csv = "id;name\n1;Alice\n2;Bob\n";
    const result = await run(
      "csv-to-html",
      fileFromText("eu.csv", csv, "text/csv"),
    );
    const html = await result.blob.text();
    expect((html.match(/<tr>/g) ?? []).length).toBe(3); // header + 2 body
    expect(html).toContain("<td>Alice</td>");
  });
});
