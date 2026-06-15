/**
 * Empty-spreadsheet guard for the raw xlsx/ods readers. A valid-but-empty
 * workbook (or a corrupt/empty upload that SheetJS reads as an empty
 * sheet) previously yielded a silent empty download. These tools now
 * throw a clear error instead. Verified by probe: an empty .xlsx made
 * xlsx-to-csv return a 0-length file with no error.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { run } from "../src/lib/engine/runner";
import { makeTinyXlsx, fileFromBytes } from "./fixtures/binary-fixtures";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const ODS_MIME = "application/vnd.oasis.opendocument.spreadsheet";
const fb = (n: string, bytes: Uint8Array, mime: string) => fileFromBytes(n, bytes, mime);

let emptyXlsx: Uint8Array;
let emptyOds: Uint8Array;

beforeAll(async () => {
  const XLSX = await import("xlsx");
  const mk = (bookType: "xlsx" | "ods") => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Sheet1");
    return new Uint8Array(XLSX.write(wb, { type: "array", bookType }));
  };
  emptyXlsx = mk("xlsx");
  emptyOds = mk("ods");
});

describe("raw spreadsheet readers throw on an empty sheet", () => {
  it("xlsx-to-csv", async () => {
    await expect(run("xlsx-to-csv", fb("e.xlsx", emptyXlsx, XLSX_MIME))).rejects.toThrow(/no data/i);
  });
  it("xlsx-to-json", async () => {
    await expect(run("xlsx-to-json", fb("e.xlsx", emptyXlsx, XLSX_MIME))).rejects.toThrow(/no data/i);
  });
  it("xlsx-to-tsv", async () => {
    await expect(run("xlsx-to-tsv", fb("e.xlsx", emptyXlsx, XLSX_MIME))).rejects.toThrow(/no data/i);
  });
  it("ods-to-csv", async () => {
    await expect(run("ods-to-csv", fb("e.ods", emptyOds, ODS_MIME))).rejects.toThrow(/no data/i);
  });
});

describe("no regression: a normal spreadsheet still converts", () => {
  it("xlsx-to-csv keeps producing data", async () => {
    const csv = await (await run("xlsx-to-csv", fb("ok.xlsx", await makeTinyXlsx(), XLSX_MIME))).blob.text();
    expect(csv.trim().length).toBeGreaterThan(0);
  });
  it("xlsx-to-json keeps producing rows", async () => {
    const json = await (await run("xlsx-to-json", fb("ok.xlsx", await makeTinyXlsx(), XLSX_MIME))).blob.text();
    expect(JSON.parse(json).length).toBeGreaterThan(0);
  });
});
