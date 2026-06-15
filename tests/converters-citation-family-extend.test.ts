/**
 * Extends the two proven PostHog-driven families (PubMed export +
 * plain-text reference list) to the remaining major citation-manager
 * formats: CSL-JSON (Zotero), EndNote (.enw), EndNote XML, NBIB. Each
 * composes the existing parser (parseRis / parseReferenceList) with an
 * existing writer, so tests assert the real bibliographic DATA lands in
 * each output format.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";

const f = (name: string, content: string) => fileFromText(name, content, "text/plain");

const PUBMED = `PMID- 30429114
TI  - Vestibular function in older adults: a review.
AU  - Smith JK
AU  - Doe RA
DP  - 2019 Mar
JT  - Journal of vestibular research
AID - 10.3233/VES-190001 [doi]
`;

const IEEE = `[1] L. Tan and T. Zrnic, "Valid Inference with Synthetic Data," JMLR, vol. 25, 2024.
[2] K. Brown, "A Single Author Study," Nature, 2019.`;

describe("pubmed-to-* extended formats", () => {
  it("pubmed-to-csl-json emits a CSL array with title + issued year", async () => {
    const arr = JSON.parse(await (await run("pubmed-to-csl-json", f("p.txt", PUBMED))).blob.text());
    expect(arr[0].title).toMatch(/Vestibular function in older adults/);
    expect(String(arr[0].issued?.["date-parts"]?.[0]?.[0])).toBe("2019");
  });
  it("pubmed-to-enw emits EndNote tagged records with the title", async () => {
    const enw = await (await run("pubmed-to-enw", f("p.txt", PUBMED))).blob.text();
    expect(enw).toMatch(/%T .*Vestibular function in older adults/);
    expect(enw).toMatch(/%A /);
  });
  it("pubmed-to-endnote-xml emits XML carrying the title", async () => {
    const xml = await (await run("pubmed-to-endnote-xml", f("p.txt", PUBMED))).blob.text();
    expect(xml).toMatch(/<\?xml/);
    expect(xml).toMatch(/Vestibular function in older adults/);
  });
  it("pubmed-to-nbib round-trips the title + PMID", async () => {
    const nbib = await (await run("pubmed-to-nbib", f("p.txt", PUBMED))).blob.text();
    expect(nbib).toMatch(/TI {2}- .*Vestibular function in older adults/);
    expect(nbib).toContain("30429114");
  });
  it("pubmed-to-enw fails loudly on a non-PubMed file", async () => {
    await expect(run("pubmed-to-enw", f("x.txt", "not a citation export at all"))).rejects.toThrow(
      /No PubMed records found/,
    );
  });
});

describe("references-to-* extended formats", () => {
  it("references-to-enw parses the IEEE list into EndNote records", async () => {
    const enw = await (await run("references-to-enw", f("r.txt", IEEE))).blob.text();
    expect(enw).toMatch(/%T .*Valid Inference with Synthetic Data/);
    expect((enw.match(/%0|%T /g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
  it("references-to-endnote-xml carries the first title", async () => {
    const xml = await (await run("references-to-endnote-xml", f("r.txt", IEEE))).blob.text();
    expect(xml).toMatch(/Valid Inference with Synthetic Data/);
  });
  it("references-to-nbib emits NBIB with the titles", async () => {
    const nbib = await (await run("references-to-nbib", f("r.txt", IEEE))).blob.text();
    expect(nbib).toMatch(/TI {2}- .*Valid Inference with Synthetic Data/);
    expect(nbib).toMatch(/A Single Author Study/);
  });
  it("references-to-nbib fails loudly on non-reference prose", async () => {
    await expect(run("references-to-nbib", f("x.txt", "just some random sentence"))).rejects.toThrow(
      /No references recognized/,
    );
  });
});
