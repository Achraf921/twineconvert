/**
 * UTF-8 BOM hardening for the JSON-reading tools. Windows editors and
 * PowerShell Out-File/Set-Content prepend a BOM, and JSON.parse rejects
 * it with a cryptic "Unexpected token '﻿'", so a valid JSON export
 * silently fails. parseJsonInput strips the BOM; these tests assert the
 * mainstream json-to-* tools accept a BOM'd file and still emit the data.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { parseJsonInput } from "../src/lib/engine/util/parse-json-input";

const BOM = "﻿";
const j = (name: string, content: string) =>
  new File([content], name, { type: "application/json" }) as unknown as File;
const ARR = BOM + JSON.stringify([{ name: "Bob", age: 30 }]);
const OBJ = BOM + JSON.stringify({ name: "Bob", age: 30 });

describe("parseJsonInput", () => {
  it("strips a leading BOM and parses", () => {
    expect(parseJsonInput<{ a: number }>(BOM + '{"a":1}')).toEqual({ a: 1 });
  });
  it("parses normal JSON unchanged", () => {
    expect(parseJsonInput('[1,2,3]')).toEqual([1, 2, 3]);
  });
  it("still throws on genuinely malformed JSON", () => {
    expect(() => parseJsonInput(BOM + "{not json}")).toThrow();
  });
});

describe("json-to-* tools accept a BOM-prefixed file", () => {
  it("json-to-csv", async () => {
    const csv = await (await run("json-to-csv", j("x.json", ARR))).blob.text();
    expect(csv).toMatch(/name/);
    expect(csv).toMatch(/Bob/);
    expect(csv).not.toContain(BOM);
  });
  it("json-to-yaml", async () => {
    const yaml = await (await run("json-to-yaml", j("x.json", ARR))).blob.text();
    expect(yaml).toMatch(/name:\s*Bob/);
  });
  it("json-to-xml", async () => {
    const xml = await (await run("json-to-xml", j("x.json", OBJ))).blob.text();
    expect(xml).toMatch(/Bob/);
    expect(xml).toMatch(/<\?xml/);
  });
  it("json-to-sql", async () => {
    const sql = await (await run("json-to-sql", j("x.json", ARR))).blob.text();
    expect(sql).toMatch(/INSERT INTO/i);
    expect(sql).toMatch(/Bob/);
  });
  it("json-to-jsonl", async () => {
    const jsonl = await (await run("json-to-jsonl", j("x.json", ARR))).blob.text();
    expect(jsonl).toMatch(/"name":\s*"Bob"/);
  });
  it("json-to-toml", async () => {
    const toml = await (await run("json-to-toml", j("x.json", OBJ))).blob.text();
    expect(toml).toMatch(/name\s*=\s*"Bob"/);
  });
  it("json-to-ini", async () => {
    const ini = await (await run("json-to-ini", j("x.json", OBJ))).blob.text();
    expect(ini).toMatch(/name\s*=\s*Bob/);
  });
  it("json-to-xlsx writes a real OOXML workbook from a BOM'd array", async () => {
    const buf = new Uint8Array(await (await run("json-to-xlsx", j("x.json", ARR))).blob.arrayBuffer());
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
