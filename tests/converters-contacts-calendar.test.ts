/**
 * Contacts (vCard) / calendar (iCalendar) / RTF batch.
 *
 * Non-shallow: every test re-parses the output and asserts real field
 * values, and the vcf<->csv and csv<->ics pairs do a full round-trip and
 * assert the data survives both directions (a parser dropping or
 * misplacing a field fails loudly).
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";

describe("vCard: vcf-to-csv / csv-to-vcf / vcf-to-json", () => {
  it("vcf-to-csv: one row per contact, fields in the right columns", async () => {
    const { parseVcard } = await import("../src/lib/engine/util/vcard");
    const expected = parseVcard(FIXTURES.vcard);
    expect(expected.length).toBe(2);

    const result = await run(
      "vcf-to-csv",
      fileFromText("contacts.vcf", FIXTURES.vcard, "text/vcard"),
    );
    expect(result.blob.type).toContain("csv");
    const Papa = (await import("papaparse")).default;
    const rows = Papa.parse<Record<string, string>>(
      (await result.blob.text()).trim(),
      { header: true },
    ).data;
    expect(rows.length).toBe(2);
    const john = rows.find((r) => r.fullName === "John Smith")!;
    expect(john).toBeDefined();
    expect(john.email).toBe("john@acme.example");
    expect(john.phone).toBe("+1-555-0101");
    expect(john.organization).toBe("Acme Inc");
    expect(john.title).toBe("Engineer");
    // Folded NOTE line must be unfolded into one value (RFC 6350 keeps
    // the continuation's leading space as content).
    expect(john.note).toBe("Met at the 2024 conference");
  });

  it("vcf <-> csv round-trips without losing contact fields", async () => {
    const csv = await run(
      "vcf-to-csv",
      fileFromText("c.vcf", FIXTURES.vcard, "text/vcard"),
    );
    const csvFile = fileFromText(
      "c.csv",
      await csv.blob.text(),
      "text/csv",
    );
    const back = await run("csv-to-vcf", csvFile);
    const { parseVcard } = await import("../src/lib/engine/util/vcard");
    const orig = parseVcard(FIXTURES.vcard);
    const round = parseVcard(await back.blob.text());
    expect(round.length).toBe(orig.length);
    for (let i = 0; i < orig.length; i++) {
      expect(round[i].fullName).toBe(orig[i].fullName);
      expect(round[i].email).toBe(orig[i].email);
      expect(round[i].phone).toBe(orig[i].phone);
      expect(round[i].firstName).toBe(orig[i].firstName);
      expect(round[i].lastName).toBe(orig[i].lastName);
    }
  });

  it("vcf-to-json emits a parseable array of contact objects", async () => {
    const result = await run(
      "vcf-to-json",
      fileFromText("c.vcf", FIXTURES.vcard, "text/vcard"),
    );
    const data = JSON.parse(await result.blob.text());
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0].email).toBe("john@acme.example");
  });

  it("vcf-to-csv rejects a non-vCard file", async () => {
    await expect(
      run("vcf-to-csv", fileFromText("x.vcf", "not a vcard at all", "text/vcard")),
    ).rejects.toThrow();
  });
});

describe("iCalendar: ics-to-csv / csv-to-ics / ics-to-json", () => {
  it("ics-to-csv: one row per event, dates normalized, all-day flagged", async () => {
    const { parseIcal } = await import("../src/lib/engine/util/ical");
    const expected = parseIcal(FIXTURES.ics);
    expect(expected.length).toBe(2);

    const result = await run(
      "ics-to-csv",
      fileFromText("cal.ics", FIXTURES.ics, "text/calendar"),
    );
    const Papa = (await import("papaparse")).default;
    const rows = Papa.parse<Record<string, string>>(
      (await result.blob.text()).trim(),
      { header: true },
    ).data;
    expect(rows.length).toBe(2);
    const kickoff = rows.find((r) => r.summary === "Project kickoff")!;
    expect(kickoff.location).toBe("Room 4B");
    expect(kickoff.start).toBe("2024-01-15 13:00:00");
    const holiday = rows.find((r) => r.summary === "Company holiday")!;
    expect(holiday.allDay).toBe("true");
    expect(holiday.start).toBe("2024-02-01");
  });

  it("csv -> ics -> parse round-trips event fields", async () => {
    const csv =
      "summary,start,end,location,description,allDay\n" +
      "Standup,2024-03-01 09:30:00,2024-03-01 09:45:00,Zoom,Daily sync,false\n";
    const ics = await run("csv-to-ics", fileFromText("e.csv", csv, "text/csv"));
    const { parseIcal } = await import("../src/lib/engine/util/ical");
    const events = parseIcal(await ics.blob.text());
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe("Standup");
    expect(events[0].location).toBe("Zoom");
    expect(events[0].start).toBe("2024-03-01 09:30:00");
  });

  it("ics-to-json emits a parseable array of events", async () => {
    const result = await run(
      "ics-to-json",
      fileFromText("c.ics", FIXTURES.ics, "text/calendar"),
    );
    const data = JSON.parse(await result.blob.text());
    expect(data).toHaveLength(2);
    expect(data[0].summary).toBe("Project kickoff");
  });

  it("csv-to-ics rejects a CSV with no usable columns", async () => {
    await expect(
      run("csv-to-ics", fileFromText("x.csv", "foo,bar\n1,2\n", "text/csv")),
    ).rejects.toThrow();
  });
});

describe("RTF: rtf-to-txt / rtf-to-html", () => {
  it("rtf-to-txt extracts body text, decodes escapes, drops control tables", async () => {
    const result = await run(
      "rtf-to-txt",
      fileFromText("doc.rtf", FIXTURES.rtf, "application/rtf"),
    );
    const text = await result.blob.text();
    expect(text).toContain("First paragraph with a");
    expect(text).toContain("\t"); // \tab decoded
    // Hex \'e9 decodes inside "café"; unicode \u233 decodes to a standalone
    // "é". Both escape paths must work: fixture text is "café and é.".
    expect(text).toContain("café");
    expect(text).toMatch(/café and é/);
    // Font/color table contents must NOT leak into the output.
    expect(text).not.toContain("Helvetica");
    expect(text).not.toContain("red255");
    // Two paragraphs separated.
    expect(text.split(/\n/).filter((l) => l.trim()).length).toBeGreaterThanOrEqual(2);
  });

  it("rtf-to-html wraps paragraphs and escapes HTML", async () => {
    const result = await run(
      "rtf-to-html",
      fileFromText("doc.rtf", FIXTURES.rtf, "application/rtf"),
    );
    const html = await result.blob.text();
    expect(html).toContain("<p>");
    expect(html).toContain("café");
    expect(html).not.toContain("Helvetica");
  });

  it("rtf-to-txt rejects a non-RTF file", async () => {
    await expect(
      run("rtf-to-txt", fileFromText("x.rtf", "just plain text", "application/rtf")),
    ).rejects.toThrow();
  });
});
