/**
 * PubMed export (.txt / .nbib MEDLINE) -> RIS / BibTeX / CSV. Demand-
 * proven: PostHog showed a user dropping a "pubmed-...set.txt" onto
 * csv-to-ris (wrong direction). PubMed "Save -> Format: PubMed" emits a
 * MEDLINE-tagged .txt our RIS parser already reads. Tests assert the
 * real fields (PMID, title, authors, year, journal, DOI) reach each
 * output format.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";

const f = (name: string, content: string) => fileFromText(name, content, "text/plain");

// Real PubMed "Save -> Format: PubMed" .txt (two MEDLINE records).
const PUBMED = `PMID- 30429114
OWN - NLM
TI  - Vestibular function in older adults: a review.
AU  - Smith JK
AU  - Doe RA
DP  - 2019 Mar
TA  - J Vestib Res
JT  - Journal of vestibular research
VI  - 29
IP  - 2
PG  - 100-110
AID - 10.3233/VES-190001 [doi]

PMID- 28000001
TI  - Conformal prediction for clinical data.
AU  - Tan L
AU  - Zrnic T
DP  - 2021
JT  - Statistics in Medicine
VI  - 40
PG  - 1-20
AID - 10.1002/sim.0001 [doi]
`;

describe("pubmed-to-ris", () => {
  it("converts a PubMed .txt to RIS with title, authors, year, journal, DOI", async () => {
    const ris = await (await run("pubmed-to-ris", f("pubmed-set.txt", PUBMED))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in older adults/);
    expect(ris).toMatch(/AU\s+-\s+Smith JK/);
    expect(ris).toMatch(/PY\s+-\s+2019/);
    expect(ris).toContain("10.3233/VES-190001");
    expect(ris).toMatch(/Journal of vestibular research/);
    // two records.
    expect((ris.match(/TY\s+-\s+/g) ?? []).length).toBe(2);
  });

  it("also accepts a .nbib file", async () => {
    const ris = await (await run("pubmed-to-ris", f("export.nbib", PUBMED))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Conformal prediction for clinical data/);
  });

  it("throws a helpful error on a non-PubMed text file", async () => {
    await expect(
      run("pubmed-to-ris", f("notes.txt", "just some plain text, not a citation export")),
    ).rejects.toThrow(/No PubMed records found/);
  });
});

describe("pubmed-to-bibtex", () => {
  it("emits BibTeX entries with title + year + DOI", async () => {
    const bib = await (await run("pubmed-to-bibtex", f("p.txt", PUBMED))).blob.text();
    expect(bib).toContain("Vestibular function in older adults");
    expect(bib).toContain("2019");
    expect(bib).toContain("10.3233/VES-190001");
    expect((bib.match(/@\w+\{/g) ?? []).length).toBe(2);
  });
});

describe("pubmed-to-csv", () => {
  it("emits CSV with the title and DOI columns populated", async () => {
    const csv = await (await run("pubmed-to-csv", f("p.txt", PUBMED))).blob.text();
    expect(csv).toMatch(/Vestibular function in older adults/);
    expect(csv).toMatch(/Conformal prediction for clinical data/);
    expect(csv).toContain("10.3233/VES-190001");
    // header + 2 data rows = at least 3 lines.
    expect(csv.trim().split(/\r?\n/).length).toBeGreaterThanOrEqual(3);
  });
});
