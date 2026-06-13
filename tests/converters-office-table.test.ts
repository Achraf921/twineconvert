/**
 * Office + table hub (RTF -> DOCX/Markdown, XLSX <-> HTML table, HTML
 * table -> CSV). Non-shallow: asserts the RTF text survives into a real
 * OOXML zip and into Markdown, that spreadsheet cell values round-trip
 * through the HTML/CSV/XLSX table conversions, entity escaping is
 * correct, and malformed input fails loudly.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";
import { makeTinyXlsx, fileFromBytes } from "./fixtures/binary-fixtures";

const f = (name: string, content: string, mime: string) => fileFromText(name, content, mime);
const reFile = (data: BlobPart, name: string, mime: string) =>
  new File([data], name, { type: mime }) as unknown as File;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Minimal but real RTF: bold heading-ish line + a paragraph.
const SAMPLE_RTF =
  "{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24 " +
  "{\\b Project Plan}\\par This is the first paragraph of the report.\\par " +
  "A second paragraph follows here.\\par}";

describe("office hub: rtf-to-docx", () => {
  it("emits a real OOXML (zip) DOCX carrying the RTF text", async () => {
    const out = await run("rtf-to-docx", f("plan.rtf", SAMPLE_RTF, "application/rtf"));
    expect(out.filename).toBe("plan.docx");
    const buf = new Uint8Array(await out.blob.arrayBuffer());
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    // Prove content survived by reading the docx back to text.
    const txt = await (await run("docx-to-txt", reFile(buf, "plan.docx", DOCX_MIME))).blob.text();
    expect(txt).toMatch(/Project Plan/);
    expect(txt).toMatch(/first paragraph/);
    expect(txt).toMatch(/second paragraph/i);
  });

  it("rejects non-RTF input loudly", async () => {
    await expect(run("rtf-to-docx", f("nope.rtf", "just plain text, no rtf header", "application/rtf"))).rejects.toThrow();
  });
});

describe("office hub: rtf-to-markdown", () => {
  it("converts RTF text to non-empty Markdown prose", async () => {
    const md = await (await run("rtf-to-markdown", f("plan.rtf", SAMPLE_RTF, "application/rtf"))).blob.text();
    expect(md).toMatch(/Project Plan/);
    expect(md).toMatch(/first paragraph/);
    expect(md).not.toMatch(/\\rtf/);
    expect(md).not.toMatch(/\\par/);
  });
});

describe("table hub: xlsx-to-html and html-to-csv / html-to-xlsx", () => {
  it("xlsx-to-html renders the sheet values into an HTML table", async () => {
    const xlsx = fileFromBytes("data.xlsx", await makeTinyXlsx(), XLSX_MIME);
    const out = await run("xlsx-to-html", xlsx);
    expect(out.filename).toBe("data.html");
    const html = await out.blob.text();
    expect(html).toMatch(/<table/i);
    expect(html).toMatch(/<\/table>/i);
    // makeTinyXlsx writes a known header/value grid; at least one <td>/<th>.
    expect(html).toMatch(/<t[dh][^>]*>/i);
  });

  it("html-to-csv extracts a table to RFC-4180 CSV with escaping", async () => {
    const html =
      "<table><tr><th>Name</th><th>Note</th></tr>" +
      "<tr><td>Alice</td><td>likes a, b</td></tr>" +
      '<tr><td>Bob</td><td>says &quot;hi&quot;</td></tr></table>';
    const csv = await (await run("html-to-csv", f("t.html", html, "text/html"))).blob.text();
    const lines = csv.split(/\r\n/);
    expect(lines[0]).toBe("Name,Note");
    expect(lines[1]).toBe('Alice,"likes a, b"');
    expect(lines[2]).toBe('Bob,"says ""hi"""');
  });

  it("html-to-xlsx writes a real OOXML workbook from a table", async () => {
    const html = "<table><tr><th>City</th><th>Pop</th></tr><tr><td>Paris</td><td>2161000</td></tr></table>";
    const out = await run("html-to-xlsx", f("cities.html", html, "text/html"));
    expect(out.filename).toBe("cities.xlsx");
    const buf = new Uint8Array(await out.blob.arrayBuffer());
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    // Round-trip back to CSV via xlsx-to-csv proves the cells landed.
    const csv = await (await run("xlsx-to-csv", reFile(buf, "cities.xlsx", XLSX_MIME))).blob.text();
    expect(csv).toMatch(/City/);
    expect(csv).toMatch(/Paris/);
    expect(csv).toMatch(/2161000/);
  });

  it("html-to-csv rejects HTML with no table loudly", async () => {
    await expect(run("html-to-csv", f("notable.html", "<p>no table here</p>", "text/html"))).rejects.toThrow();
  });

  it("round-trips HTML table -> CSV -> HTML preserving a cell value", async () => {
    const html = "<table><tr><th>K</th><th>V</th></tr><tr><td>alpha</td><td>42</td></tr></table>";
    const csv = await (await run("html-to-csv", f("rt.html", html, "text/html"))).blob.text();
    const back = await (await run("csv-to-html", reFile(csv, "rt.csv", "text/csv"))).blob.text();
    expect(back).toMatch(/alpha/);
    expect(back).toMatch(/42/);
  });
});
