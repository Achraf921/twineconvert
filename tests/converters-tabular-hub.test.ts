/**
 * Tabular hub gap fills (markdown-table / html-table / json / xlsx).
 * Non-shallow: asserts real cell values + headers survive each hop, the
 * right target structure is emitted, and md->json->md round-trips.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";
import { makeTinyXlsx, fileFromBytes } from "./fixtures/binary-fixtures";

const F = FIXTURES;
const md = () => fileFromText("t.md", F.markdownTable, "text/markdown");
const html = () => fileFromText("t.html", F.htmlTable, "text/html");
const json = () => fileFromText("t.json", F.jsonArray, "application/json");
const reFile = (text: string, name: string, mime: string) =>
  new File([text], name, { type: mime }) as unknown as File;

describe("tabular hub: markdown <-> html", () => {
  it("markdown-table-to-html-table emits a real HTML table with the cells", async () => {
    const out = await (await run("markdown-table-to-html-table", md())).blob.text();
    expect(out).toMatch(/<table/);
    expect(out).toMatch(/<th>name<\/th>/i);
    expect(out).toContain("Alice");
    expect(out).toContain("Tokyo");
  });
  it("html-table-to-markdown-table emits a pipe table with the cells", async () => {
    const out = await (await run("html-table-to-markdown-table", html())).blob.text();
    expect(out).toMatch(/\|\s*name\s*\|/);
    expect(out).toContain("Alice");
    expect(out).toContain("Paris");
    expect(out).toMatch(/\|\s*-+\s*\|/); // separator row
  });
});

describe("tabular hub: table <-> json", () => {
  it("markdown-table-to-json yields row objects keyed by header", async () => {
    const arr = JSON.parse(await (await run("markdown-table-to-json", md())).blob.text());
    expect(Array.isArray(arr)).toBe(true);
    expect(arr[0]).toMatchObject({ name: "Alice", age: "30", city: "Paris" });
    expect(arr).toHaveLength(3);
  });
  it("html-table-to-json yields row objects keyed by header", async () => {
    const arr = JSON.parse(await (await run("html-table-to-json", html())).blob.text());
    expect(arr[2]).toMatchObject({ name: "Carol", city: "Tokyo" });
  });
  it("json-to-markdown-table emits a pipe table with json keys + values", async () => {
    const out = await (await run("json-to-markdown-table", json())).blob.text();
    expect(out).toMatch(/\|\s*name\s*\|\s*age\s*\|/);
    expect(out).toContain("Alice");
    expect(out).toContain("Bob");
  });
  it("json-to-html-table emits an HTML table with json data", async () => {
    const out = await (await run("json-to-html-table", json())).blob.text();
    expect(out).toMatch(/<table/);
    expect(out).toContain("Alice");
    expect(out).toMatch(/<th>name<\/th>/i);
  });
});

describe("tabular hub: -> xlsx and xlsx ->", () => {
  for (const id of ["markdown-table-to-xlsx", "html-table-to-xlsx"] as const) {
    it(`${id} emits a zip-backed XLSX`, async () => {
      const input = id.startsWith("markdown") ? md() : html();
      const bytes = new Uint8Array(await (await run(id, input)).blob.arrayBuffer());
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
      expect(bytes.byteLength).toBeGreaterThan(1000);
    });
  }
  it("xlsx-to-markdown-table emits a pipe table from the workbook", async () => {
    const xlsx = fileFromBytes("t.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const out = await (await run("xlsx-to-markdown-table", xlsx)).blob.text();
    expect(out).toMatch(/^\|.*\|$/m);
    expect(out).toMatch(/\|\s*-+\s*\|/);
    expect(out.split("\n").length).toBeGreaterThan(2);
  });
  it("xlsx-to-html-table emits an HTML table from the workbook", async () => {
    const xlsx = fileFromBytes("t.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const out = await (await run("xlsx-to-html-table", xlsx)).blob.text();
    expect(out).toMatch(/<table/);
    expect(out).toMatch(/<t[hd]>/);
  });
});

describe("tabular hub: round-trip + failure", () => {
  it("markdown -> json -> markdown preserves headers + cells", async () => {
    const r1 = await run("markdown-table-to-json", md());
    const r2 = await run("json-to-markdown-table", reFile(await r1.blob.text(), "rt.json", "application/json"));
    const out = await r2.blob.text();
    expect(out).toContain("Alice");
    expect(out).toContain("Carol");
    expect(out).toMatch(/\|\s*name\s*\|/);
  });
  it("json-to-markdown-table throws on non-array JSON", async () => {
    await expect(
      run("json-to-markdown-table", fileFromText("o.json", '{"not":"an array"}', "application/json")),
    ).rejects.toThrow(/array of row objects/i);
  });
  it("markdown-table-to-json throws on input with no table", async () => {
    await expect(
      run("markdown-table-to-json", fileFromText("p.md", "# just a heading\n\nsome prose\n", "text/markdown")),
    ).rejects.toThrow();
  });
});
