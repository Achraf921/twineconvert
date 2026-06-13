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

describe("remaining direct-papaparse CSV tools: Excel sep= hardening", () => {
  // Each asserts the real data value survives and the sep= line never
  // leaks into the output (its signature when the preamble breaks parsing).
  it("csv-to-jsonl keeps keyed values from a sep=; CSV", async () => {
    const out = await (await run("csv-to-jsonl", f("x.csv", "sep=;\nname;age\nBob;30\n"))).blob.text();
    expect(out).toMatch(/"name":\s*"Bob"/);
    expect(out).not.toMatch(/sep=/);
  });
  it("csv-to-sql emits INSERTs with the row data from a sep=; CSV", async () => {
    const out = await (await run("csv-to-sql", f("x.csv", "sep=;\nid;name\n1;Bob\n"))).blob.text();
    expect(out).toMatch(/INSERT INTO/i);
    expect(out).toMatch(/Bob/);
    expect(out).not.toMatch(/sep=/);
  });
  it("csv-to-vcf keeps the contact from a sep=; CSV", async () => {
    const out = await (await run("csv-to-vcf", f("x.csv", "sep=;\nfullName;email\nBob Smith;bob@x.com\n"))).blob.text();
    expect(out).toMatch(/Bob Smith/);
    expect(out).not.toMatch(/sep=/);
  });
  it("csv-to-ics keeps the event from a sep=; CSV", async () => {
    const out = await (await run("csv-to-ics", f("x.csv", "sep=;\nsummary;dtstart\nTeam Meeting;2024-01-15\n"))).blob.text();
    expect(out).toMatch(/Team Meeting/);
    expect(out).not.toMatch(/sep=/);
  });
  it("csv-to-gedcom keeps the individual from a sep=; CSV", async () => {
    const out = await (await run("csv-to-gedcom", f("x.csv", "sep=;\nname;sex\nJohn Doe;M\n"))).blob.text();
    expect(out).toMatch(/John/);
    expect(out).not.toMatch(/sep=/);
  });
  it("csv-to-markdown-table renders a table from a sep=; CSV", async () => {
    const out = await (await run("csv-to-markdown-table", f("x.csv", "sep=;\nName;Age\nBob;30\n"))).blob.text();
    expect(out).toMatch(/\|\s*Name\s*\|/);
    expect(out).toMatch(/\|\s*Bob\s*\|/);
    expect(out).not.toMatch(/sep=/);
  });
  it("csv-to-html-table renders a table from a sep=; CSV", async () => {
    const out = await (await run("csv-to-html-table", f("x.csv", "sep=;\nName;Age\nBob;30\n"))).blob.text();
    expect(out).toMatch(/Bob/);
    expect(out).not.toMatch(/sep=/);
  });
  it("csv-to-fhir-bundle keeps the resource from a sep=; CSV", async () => {
    const out = await (await run("csv-to-fhir-bundle", f("x.csv", "sep=;\nresourceType;name\nPatient;Bob\n"))).blob.text();
    expect(out).toMatch(/Patient/);
    expect(out).not.toMatch(/sep=/);
  });
});
