/**
 * Excel `sep=` locale-hint + BOM hardening across the CSV-reading tools.
 * Excel "Save as CSV" (esp. non-US locales) prepends `sep=;` / `sep=,`,
 * which left in place is read as the header row and corrupts the whole
 * conversion. stripCsvPreamble centralizes the fix; these tests assert it
 * works through the actual converters (csv-to-json/xlsx/yaml/html) and
 * does not regress a normal comma CSV.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { stripCsvPreamble } from "../src/lib/engine/util/csv-parse-flex";
import { fileFromText } from "./fixtures/text-fixtures";

const f = (name: string, content: string) => fileFromText(name, content, "text/csv");
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

describe("stripCsvPreamble", () => {
  it("strips an Excel sep=; line and reports the delimiter", () => {
    const r = stripCsvPreamble("sep=;\nName;Age\nBob;30\n");
    expect(r.delimiter).toBe(";");
    expect(r.text.startsWith("Name;Age")).toBe(true);
  });
  it("strips sep=, and a leading BOM", () => {
    const r = stripCsvPreamble("﻿sep=,\nA,B\n1,2\n");
    expect(r.delimiter).toBe(",");
    expect(r.text.startsWith("A,B")).toBe(true);
  });
  it("leaves a normal CSV untouched (no forced delimiter)", () => {
    const r = stripCsvPreamble("A,B\n1,2\n");
    expect(r.delimiter).toBeUndefined();
    expect(r.text).toBe("A,B\n1,2\n");
  });
});

describe("csv-to-json: Excel sep= hardening", () => {
  it("parses a sep=; semicolon CSV into keyed objects", async () => {
    const out = await (await run("csv-to-json", f("x.csv", "sep=;\nName;Age\nBob;30\nAmy;25\n"))).blob.text();
    const arr = JSON.parse(out);
    expect(arr).toHaveLength(2);
    expect(arr[0].Name).toBe("Bob");
    expect(arr[0].Age).toBe(30);
    expect(Object.keys(arr[0])).not.toContain("sep=");
  });
  it("does not regress a normal comma CSV", async () => {
    const arr = JSON.parse(await (await run("csv-to-json", f("n.csv", "Name,Age\nBob,30\n"))).blob.text());
    expect(arr[0].Name).toBe("Bob");
  });
});

describe("csv-to-yaml: Excel sep= hardening", () => {
  it("parses sep=, prefixed CSV with the right keys", async () => {
    const yaml = await (await run("csv-to-yaml", f("x.csv", "sep=,\nCity,Pop\nParis,2161000\n"))).blob.text();
    expect(yaml).toMatch(/City:\s*Paris/);
    expect(yaml).toMatch(/Pop:\s*2161000/);
    expect(yaml).not.toMatch(/sep=/);
  });
});

describe("csv-to-xlsx: Excel sep= hardening", () => {
  it("writes a real workbook whose cells round-trip back via xlsx-to-csv", async () => {
    const out = await run("csv-to-xlsx", f("x.csv", "sep=;\nName;Age\nBob;30\n"));
    const buf = new Uint8Array(await out.blob.arrayBuffer());
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const csv = await (
      await run("xlsx-to-csv", new File([buf], "x.xlsx", { type: XLSX_MIME }) as unknown as File)
    ).blob.text();
    expect(csv).toMatch(/Name/);
    expect(csv).toMatch(/Bob/);
    expect(csv).not.toMatch(/sep=/);
  });
});

describe("csv-to-html (parseCsvFlex): Excel sep= hardening", () => {
  it("renders a real table from a sep=; CSV (not a 'sep=' header)", async () => {
    const html = await (await run("csv-to-html", f("x.csv", "sep=;\nName;Age\nBob;30\n"))).blob.text();
    expect(html).toMatch(/<th[^>]*>Name<\/th>/);
    expect(html).toMatch(/<td[^>]*>Bob<\/td>/);
    expect(html).not.toMatch(/sep=/);
  });
});
