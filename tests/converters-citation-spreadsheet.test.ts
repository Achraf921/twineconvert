/**
 * Systematic-review workflow routes: PubMed export + reference list ->
 * spreadsheet (CSV / XLSX) for screening in Excel. Compose the existing
 * parsers (parseRis / parseReferenceList) with citationsToCsv +
 * csvStringToXlsx. Tests assert the real fields land in the output and
 * the XLSX round-trips back to CSV.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";
import { fileFromBytes } from "./fixtures/binary-fixtures";

const f = (name: string, content: string) => fileFromText(name, content, "text/plain");
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const reXlsx = (buf: Uint8Array) => fileFromBytes("x.xlsx", buf, XLSX_MIME);

const PUBMED = `PMID- 30429114
TI  - Vestibular function in older adults: a review.
AU  - Smith JK
DP  - 2019 Mar
JT  - Journal of vestibular research
AID - 10.3233/VES-190001 [doi]

PMID- 28000001
TI  - Conformal prediction for clinical data.
AU  - Tan L
DP  - 2021
JT  - Statistics in Medicine
`;

const IEEE = `[1] L. Tan and T. Zrnic, "Valid Inference with Synthetic Data," JMLR, vol. 25, 2024.
[2] K. Brown, "A Single Author Study," Nature, 2019.`;

describe("pubmed-to-xlsx", () => {
  it("writes a real OOXML workbook that round-trips the titles back to CSV", async () => {
    const out = await run("pubmed-to-xlsx", f("set.txt", PUBMED));
    expect(out.filename).toBe("set.xlsx");
    const buf = new Uint8Array(await out.blob.arrayBuffer());
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const csv = await (await run("xlsx-to-csv", reXlsx(buf))).blob.text();
    expect(csv).toMatch(/Vestibular function in older adults/);
    expect(csv).toMatch(/Conformal prediction for clinical data/);
    expect(csv).toContain("10.3233/VES-190001");
  });
  it("fails loudly on a non-PubMed file", async () => {
    await expect(run("pubmed-to-xlsx", f("x.txt", "not a citation export"))).rejects.toThrow(
      /No PubMed records found/,
    );
  });
});

describe("references-to-csv / references-to-xlsx", () => {
  it("references-to-csv emits a header + one row per reference", async () => {
    const csv = await (await run("references-to-csv", f("r.txt", IEEE))).blob.text();
    expect(csv).toMatch(/Valid Inference with Synthetic Data/);
    expect(csv).toMatch(/A Single Author Study/);
    expect(csv).toMatch(/2024/);
    // header + 2 rows.
    expect(csv.trim().split(/\r?\n/).length).toBeGreaterThanOrEqual(3);
  });
  it("references-to-xlsx writes a workbook round-tripping the titles", async () => {
    const out = await run("references-to-xlsx", f("r.txt", IEEE));
    const buf = new Uint8Array(await out.blob.arrayBuffer());
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const csv = await (await run("xlsx-to-csv", reXlsx(buf))).blob.text();
    expect(csv).toMatch(/Valid Inference with Synthetic Data/);
  });
  it("references-to-csv fails loudly on non-reference prose", async () => {
    await expect(run("references-to-csv", f("x.txt", "just a sentence"))).rejects.toThrow(
      /No references recognized/,
    );
  });
});
