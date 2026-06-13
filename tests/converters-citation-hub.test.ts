/**
 * Citation hub completion batch (CSL-JSON / EndNote XML / NBIB cross-
 * pairs). These routes compose already-tested parsers and writers
 * through the unified Citation model, so the risk isn't "does the format
 * parse" (the comprehensive suite covers structural validity) — it's
 * "does the actual bibliographic DATA survive the hop". Every test below
 * asserts real field content (title, author, year, DOI), not just that
 * the output is well-formed.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";

const F = FIXTURES;
const CITATION_CSV =
  "id,type,title,authors,year,journal,volume,issue,pages,doi\n" +
  'smith2021,article,"A Study of Things","Smith, John; Doe, Jane","2021","Nature","12","3","45-67","10.1000/xyz"';

const f = (name: string, content: string, mime: string) => fileFromText(name, content, mime);
const reFile = (text: string, name: string, mime: string) =>
  new File([text], name, { type: mime }) as unknown as File;

describe("citation hub: CSL-JSON pairs carry real data", () => {
  it("csl-json-to-ris keeps title, author, year, doi", async () => {
    const r = await run("csl-json-to-ris", f("a.json", F.cslJson, "application/json"));
    const ris = await r.blob.text();
    expect(ris).toMatch(/TI\s+-\s+A Sample Paper/);
    expect(ris).toMatch(/AU\s+-\s+Smith, John/);
    expect(ris).toMatch(/PY\s+-\s+2024/);
    expect(ris).toContain("10.1038/sample.2024.001");
  });

  it("ris-to-csl-json emits a CSL array with title + DOI + year", async () => {
    const r = await run("ris-to-csl-json", f("a.ris", F.ris, "application/x-research-info-systems"));
    const arr = JSON.parse(await r.blob.text());
    expect(Array.isArray(arr)).toBe(true);
    expect(arr[0].title).toBe("A Sample Paper");
    expect(arr[0].DOI).toBe("10.1038/sample.2024.001");
    expect(arr[0].issued["date-parts"][0][0]).toBe(2024);
  });

  it("csl-json-to-csv has a title column with the real value", async () => {
    const r = await run("csl-json-to-csv", f("a.json", F.cslJson, "application/json"));
    const csv = await r.blob.text();
    expect(csv).toMatch(/title/i);
    expect(csv).toContain("A Sample Paper");
  });

  it("csv-to-csl-json parses our CSV into CSL with title + DOI", async () => {
    const r = await run("csv-to-csl-json", f("a.csv", CITATION_CSV, "text/csv"));
    const arr = JSON.parse(await r.blob.text());
    expect(arr[0].title).toBe("A Study of Things");
    expect(arr[0].DOI).toBe("10.1000/xyz");
  });
});

describe("citation hub: EndNote XML + NBIB to CSV (high-demand exports)", () => {
  it("endnote-xml-to-csv carries the EndNote title", async () => {
    const r = await run("endnote-xml-to-csv", f("a.xml", F.endnoteXml, "application/xml"));
    const csv = await r.blob.text();
    expect(csv).toContain("EndNote Sample Article");
  });

  it("nbib-to-csv carries the PubMed title + DOI", async () => {
    const r = await run("nbib-to-csv", f("a.nbib", F.nbibRealPubMed, "application/x-research-info-systems"));
    const csv = await r.blob.text();
    expect(csv).toContain("Synaptic plasticity in the mouse hippocampus");
    expect(csv).toContain("10.1038/s41593-018-0244-8");
  });

  it("csv-to-endnote-xml produces EndNote XML carrying the title", async () => {
    const r = await run("csv-to-endnote-xml", f("a.csv", CITATION_CSV, "text/csv"));
    const xml = await r.blob.text();
    expect(xml).toContain("A Study of Things");
    expect(xml).toMatch(/<title/i);
  });

  it("csv-to-nbib produces MEDLINE carrying the title", async () => {
    const r = await run("csv-to-nbib", f("a.csv", CITATION_CSV, "text/csv"));
    const nbib = await r.blob.text();
    expect(nbib).toContain("A Study of Things");
    expect(nbib).toMatch(/TI\s+-/);
  });
});

describe("citation hub: round-trips preserve the record", () => {
  it("CSL-JSON -> RIS -> CSL-JSON keeps title/year/doi", async () => {
    const r1 = await run("csl-json-to-ris", f("a.json", F.cslJson, "application/json"));
    const r2 = await run("ris-to-csl-json", reFile(await r1.blob.text(), "b.ris", "application/x-research-info-systems"));
    const arr = JSON.parse(await r2.blob.text());
    expect(arr[0].title).toBe("A Sample Paper");
    expect(arr[0].DOI).toBe("10.1038/sample.2024.001");
    expect(arr[0].issued["date-parts"][0][0]).toBe(2024);
  });

  it("EndNote XML -> CSV -> EndNote XML keeps the title", async () => {
    const r1 = await run("endnote-xml-to-csv", f("a.xml", F.endnoteXml, "application/xml"));
    const r2 = await run("csv-to-endnote-xml", reFile(await r1.blob.text(), "b.csv", "text/csv"));
    const xml = await r2.blob.text();
    expect(xml).toContain("EndNote Sample Article");
  });

  it("NBIB -> CSL-JSON -> NBIB keeps the PubMed title", async () => {
    const r1 = await run("nbib-to-csl-json", f("a.nbib", F.nbibRealPubMed, "application/x-research-info-systems"));
    const r2 = await run("csl-json-to-nbib", reFile(await r1.blob.text(), "b.json", "application/json"));
    const nbib = await r2.blob.text();
    expect(nbib).toContain("Synaptic plasticity in the mouse hippocampus");
  });
});

describe("citation hub: XLSX exports are real spreadsheets", () => {
  for (const id of ["endnote-xml-to-xlsx", "csl-json-to-xlsx"] as const) {
    it(`${id} emits a zip-backed XLSX with content`, async () => {
      const input =
        id === "endnote-xml-to-xlsx"
          ? f("a.xml", F.endnoteXml, "application/xml")
          : f("a.json", F.cslJson, "application/json");
      const r = await run(id, input);
      const bytes = new Uint8Array(await r.blob.arrayBuffer());
      // XLSX is a zip: first two bytes are "PK".
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
      expect(bytes.byteLength).toBeGreaterThan(1000);
    });
  }
});

describe("citation hub: remaining cross-pairs carry real data", () => {
  it("csl-json-to-endnote-xml emits EndNote XML with the title", async () => {
    const r = await run("csl-json-to-endnote-xml", f("a.json", F.cslJson, "application/json"));
    const xml = await r.blob.text();
    expect(xml).toContain("A Sample Paper");
    expect(xml).toMatch(/<title/i);
  });

  it("endnote-xml-to-csl-json emits a CSL array with the EndNote title", async () => {
    const r = await run("endnote-xml-to-csl-json", f("a.xml", F.endnoteXml, "application/xml"));
    const arr = JSON.parse(await r.blob.text());
    expect(arr[0].title).toBe("EndNote Sample Article");
  });

  it("endnote-xml-to-nbib emits MEDLINE carrying the EndNote title", async () => {
    const r = await run("endnote-xml-to-nbib", f("a.xml", F.endnoteXml, "application/xml"));
    const nbib = await r.blob.text();
    expect(nbib).toContain("EndNote Sample Article");
    expect(nbib).toMatch(/TI\s+-/);
  });

  it("nbib-to-endnote-xml emits EndNote XML carrying the PubMed title", async () => {
    const r = await run("nbib-to-endnote-xml", f("a.nbib", F.nbibRealPubMed, "application/x-research-info-systems"));
    const xml = await r.blob.text();
    expect(xml).toContain("Synaptic plasticity in the mouse hippocampus");
    expect(xml).toMatch(/<title/i);
  });
});

describe("citation hub: bibliography renders carry the real titles", () => {
  const SOURCES = [
    { fmt: "ris", file: () => f("a.ris", F.ris, "application/x-research-info-systems"), title: "A Sample Paper" },
    { fmt: "nbib", file: () => f("a.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), title: "Synaptic plasticity in the mouse hippocampus" },
    { fmt: "csl-json", file: () => f("a.json", F.cslJson, "application/json"), title: "A Sample Paper" },
    { fmt: "endnote-xml", file: () => f("a.xml", F.endnoteXml, "application/xml"), title: "EndNote Sample Article" },
  ] as const;

  for (const s of SOURCES) {
    it(`${s.fmt}-to-markdown renders the title`, async () => {
      const r = await run(`${s.fmt}-to-markdown`, s.file());
      expect(r.blob.type).toContain("markdown");
      expect(await r.blob.text()).toContain(s.title);
    });
    it(`${s.fmt}-to-html renders the title in HTML`, async () => {
      const r = await run(`${s.fmt}-to-html`, s.file());
      const html = await r.blob.text();
      expect(html).toContain(s.title);
      expect(html).toMatch(/<\w+/); // real markup, not bare text
    });
    it(`${s.fmt}-to-yaml emits a CSL-YAML references list with the title`, async () => {
      const r = await run(`${s.fmt}-to-yaml`, s.file());
      const yaml = await r.blob.text();
      expect(yaml).toMatch(/references:/);
      expect(yaml).toContain(s.title);
    });
  }
});

describe("citation hub: empty / invalid inputs fail loudly", () => {
  it("csl-json-to-ris throws on an empty CSL array", async () => {
    await expect(
      run("csl-json-to-ris", f("e.json", "[]", "application/json")),
    ).rejects.toThrow(/No references found/);
  });

  it("endnote-xml-to-csv throws on XML with no records", async () => {
    await expect(
      run("endnote-xml-to-csv", f("e.xml", "<xml><records></records></xml>", "application/xml")),
    ).rejects.toThrow(/No references found/);
  });
});
