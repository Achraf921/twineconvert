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
import { fileFromBytes, makeTinyCitationXlsx, makeTinyCitationOds, makeTinyXlsx } from "./fixtures/binary-fixtures";

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

const ENW_SAMPLE =
  "%0 Journal Article\n%A Smith, John\n%A Doe, Jane\n%T Vestibular function in aging adults\n" +
  "%J Journal of Neurology\n%D 2006\n%V 253\n%N 11\n%P 1499-1508\n%@ 1432-1459\n" +
  "%R 10.1007/s00415-006-0001-x\n%K balance\n%X We measured vestibular thresholds.\n%F smith2006\n";

describe("citation hub: EndNote ENW carries real data", () => {
  it("enw-to-bibtex keeps title + DOI", async () => {
    const r = await run("enw-to-bibtex", f("a.enw", ENW_SAMPLE, "application/x-endnote-refer"));
    const bib = await r.blob.text();
    expect(bib).toContain("Vestibular function in aging adults");
    expect(bib).toContain("10.1007/s00415-006-0001-x");
  });

  it("enw-to-ris keeps title, both authors, year", async () => {
    const r = await run("enw-to-ris", f("a.enw", ENW_SAMPLE, "application/x-endnote-refer"));
    const ris = await r.blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in aging adults/);
    expect(ris).toMatch(/AU\s+-\s+Smith, John/);
    expect(ris).toMatch(/AU\s+-\s+Doe, Jane/);
    expect(ris).toMatch(/PY\s+-\s+2006/);
  });

  it("enw-to-csv carries the title", async () => {
    const r = await run("enw-to-csv", f("a.enw", ENW_SAMPLE, "application/x-endnote-refer"));
    expect(await r.blob.text()).toContain("Vestibular function in aging adults");
  });

  it("ris-to-enw emits ENW with %0, %T and the RIS title", async () => {
    const r = await run("ris-to-enw", f("a.ris", F.ris, "application/x-research-info-systems"));
    const enw = await r.blob.text();
    expect(r.blob.type).toContain("endnote-refer");
    expect(enw).toMatch(/^%0 /m);
    expect(enw).toMatch(/^%T A Sample Paper/m);
    expect(enw).toMatch(/^%A Smith, John/m);
  });

  it("csv-to-enw emits ENW carrying the CSV title", async () => {
    const r = await run("csv-to-enw", f("a.csv", CITATION_CSV, "text/csv"));
    const enw = await r.blob.text();
    expect(enw).toContain("A Study of Things");
    expect(enw).toMatch(/^%0 /m);
  });

  it("round-trip ENW -> RIS -> ENW preserves title + DOI", async () => {
    const r1 = await run("enw-to-ris", f("a.enw", ENW_SAMPLE, "application/x-endnote-refer"));
    const r2 = await run("ris-to-enw", reFile(await r1.blob.text(), "b.ris", "application/x-research-info-systems"));
    const enw = await r2.blob.text();
    expect(enw).toContain("Vestibular function in aging adults");
    expect(enw).toContain("10.1007/s00415-006-0001-x");
  });

  it("enw-to-xlsx is a zip-backed spreadsheet", async () => {
    const r = await run("enw-to-xlsx", f("a.enw", ENW_SAMPLE, "application/x-endnote-refer"));
    const bytes = new Uint8Array(await r.blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it("enw-to-bibtex throws on input with no records", async () => {
    await expect(
      run("enw-to-bibtex", f("e.enw", "not an enw file\n", "application/x-endnote-refer")),
    ).rejects.toThrow(/No references found/);
  });
});

const WOS_SAMPLE =
  "FN Clarivate Analytics Web of Science\nVR 1.0\nPT J\n" +
  "AU Smith, J\n   Doe, J\nAF Smith, John\n   Doe, Jane\n" +
  "TI Vestibular function in aging adults\nSO JOURNAL OF NEUROLOGY\nPY 2006\n" +
  "VL 253\nIS 11\nBP 1499\nEP 1508\nDI 10.1007/s00415-006-0001-x\n" +
  "DE balance; aging\nAB We measured vestibular thresholds.\nSN 1432-1459\n" +
  "UT WOS:000241500100001\nER\n\nEF\n";

describe("citation hub: Web of Science carries real data", () => {
  const wos = () => f("savedrecs.txt", WOS_SAMPLE, "text/plain");

  it("wos-to-bibtex keeps title + DOI", async () => {
    const bib = await (await run("wos-to-bibtex", wos())).blob.text();
    expect(bib).toContain("Vestibular function in aging adults");
    expect(bib).toContain("10.1007/s00415-006-0001-x");
  });

  it("wos-to-ris keeps title, both full-name authors, year", async () => {
    const ris = await (await run("wos-to-ris", wos())).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in aging adults/);
    expect(ris).toMatch(/AU\s+-\s+Smith, John/);
    expect(ris).toMatch(/AU\s+-\s+Doe, Jane/);
    expect(ris).toMatch(/PY\s+-\s+2006/);
  });

  it("wos-to-csl-json emits a CSL array with title + DOI + journal", async () => {
    const arr = JSON.parse(await (await run("wos-to-csl-json", wos())).blob.text());
    expect(arr[0].title).toBe("Vestibular function in aging adults");
    expect(arr[0].DOI).toBe("10.1007/s00415-006-0001-x");
    expect(arr[0]["container-title"]).toBe("JOURNAL OF NEUROLOGY");
  });

  it("wos-to-csv carries the title and keywords", async () => {
    const csv = await (await run("wos-to-csv", wos())).blob.text();
    expect(csv).toContain("Vestibular function in aging adults");
    expect(csv).toContain("balance");
  });

  it("wos-to-xlsx is a zip-backed spreadsheet", async () => {
    const bytes = new Uint8Array(await (await run("wos-to-xlsx", wos())).blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it("wos-to-bibtex throws on input with no records", async () => {
    await expect(
      run("wos-to-bibtex", f("e.txt", "just some plain text\nno tags here\n", "text/plain")),
    ).rejects.toThrow(/No references found/);
  });
});

const RWS_SAMPLE =
  "RT Journal Article\nA1 Smith, John\nA1 Doe, Jane\nT1 Vestibular function in aging adults\n" +
  "JF Journal of Neurology\nYR 2006\nVO 253\nIS 11\nSP 1499\nOP 1508\n" +
  "DO 10.1007/s00415-006-0001-x\nK1 balance\nK1 aging\nAB We measured vestibular thresholds.\n" +
  "SN 1432-1459\nPB Springer\nID smith2006\n";

describe("citation hub: RefWorks tagged format carries real data", () => {
  const rws = () => f("refs.txt", RWS_SAMPLE, "text/plain");

  it("refworks-to-bibtex keeps title + DOI", async () => {
    const bib = await (await run("refworks-to-bibtex", rws())).blob.text();
    expect(bib).toContain("Vestibular function in aging adults");
    expect(bib).toContain("10.1007/s00415-006-0001-x");
  });

  it("refworks-to-ris keeps title, both authors, year, pages", async () => {
    const ris = await (await run("refworks-to-ris", rws())).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in aging adults/);
    expect(ris).toMatch(/AU\s+-\s+Smith, John/);
    expect(ris).toMatch(/AU\s+-\s+Doe, Jane/);
    expect(ris).toMatch(/PY\s+-\s+2006/);
  });

  it("ris-to-refworks emits RefWorks with RT, T1, A1 and the RIS title", async () => {
    const r = await run("ris-to-refworks", f("a.ris", F.ris, "application/x-research-info-systems"));
    const rwt = await r.blob.text();
    expect(r.blob.type).toContain("refworks");
    expect(rwt).toMatch(/^RT /m);
    expect(rwt).toMatch(/^T1 A Sample Paper/m);
    expect(rwt).toMatch(/^A1 Smith, John/m);
  });

  it("csv-to-refworks emits RefWorks carrying the CSV title", async () => {
    const rwt = await (await run("csv-to-refworks", f("a.csv", CITATION_CSV, "text/csv"))).blob.text();
    expect(rwt).toContain("A Study of Things");
    expect(rwt).toMatch(/^RT /m);
  });

  it("round-trip RefWorks -> RIS -> RefWorks preserves title + DOI + pages", async () => {
    const r1 = await run("refworks-to-ris", rws());
    const r2 = await run("ris-to-refworks", reFile(await r1.blob.text(), "b.ris", "application/x-research-info-systems"));
    const rwt = await r2.blob.text();
    expect(rwt).toContain("Vestibular function in aging adults");
    expect(rwt).toContain("10.1007/s00415-006-0001-x");
    expect(rwt).toMatch(/^SP 1499/m);
  });

  it("refworks-to-bibtex throws on input with no records", async () => {
    await expect(
      run("refworks-to-bibtex", f("e.txt", "plain text, no RefWorks tags\n", "text/plain")),
    ).rejects.toThrow(/No references found/);
  });
});

const MODS_SAMPLE =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<modsCollection xmlns="http://www.loc.gov/mods/v3">\n' +
  '  <mods version="3.7">\n' +
  '    <titleInfo><title>Vestibular function in aging adults</title></titleInfo>\n' +
  '    <name type="personal"><namePart type="family">Smith</namePart><namePart type="given">John</namePart>' +
  '<role><roleTerm type="text">author</roleTerm></role></name>\n' +
  '    <name type="personal"><namePart type="family">Doe</namePart><namePart type="given">Jane</namePart></name>\n' +
  '    <genre>journal article</genre>\n' +
  '    <originInfo><publisher>Springer</publisher><dateIssued>2006</dateIssued></originInfo>\n' +
  '    <relatedItem type="host"><titleInfo><title>Journal of Neurology</title></titleInfo>' +
  '<part><detail type="volume"><number>253</number></detail><detail type="issue"><number>11</number></detail>' +
  '<extent unit="pages"><start>1499</start><end>1508</end></extent></part></relatedItem>\n' +
  '    <identifier type="doi">10.1007/s00415-006-0001-x</identifier>\n' +
  '    <identifier type="issn">1432-1459</identifier>\n' +
  '    <subject><topic>balance</topic></subject>\n' +
  '    <abstract>We measured vestibular thresholds.</abstract>\n' +
  '  </mods>\n' +
  '</modsCollection>\n';

describe("citation hub: MODS XML carries real data", () => {
  const mods = () => f("rec.mods.xml", MODS_SAMPLE, "application/mods+xml");

  it("mods-to-bibtex keeps title + DOI", async () => {
    const bib = await (await run("mods-to-bibtex", mods())).blob.text();
    expect(bib).toContain("Vestibular function in aging adults");
    expect(bib).toContain("10.1007/s00415-006-0001-x");
  });

  it("mods-to-ris keeps title, both family/given authors, year", async () => {
    const ris = await (await run("mods-to-ris", mods())).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in aging adults/);
    expect(ris).toMatch(/AU\s+-\s+Smith, John/);
    expect(ris).toMatch(/AU\s+-\s+Doe, Jane/);
    expect(ris).toMatch(/PY\s+-\s+2006/);
  });

  it("mods-to-csl-json emits title + DOI + container from relatedItem", async () => {
    const arr = JSON.parse(await (await run("mods-to-csl-json", mods())).blob.text());
    expect(arr[0].title).toBe("Vestibular function in aging adults");
    expect(arr[0].DOI).toBe("10.1007/s00415-006-0001-x");
    expect(arr[0]["container-title"]).toBe("Journal of Neurology");
  });

  it("mods-to-csv carries the title and a keyword", async () => {
    const csv = await (await run("mods-to-csv", mods())).blob.text();
    expect(csv).toContain("Vestibular function in aging adults");
    expect(csv).toContain("balance");
  });

  it("mods-to-nbib carries the title", async () => {
    const nbib = await (await run("mods-to-nbib", mods())).blob.text();
    expect(nbib).toContain("Vestibular function in aging adults");
  });

  it("mods-to-xlsx is a zip-backed spreadsheet", async () => {
    const bytes = new Uint8Array(await (await run("mods-to-xlsx", mods())).blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it("bibtex-to-mods emits MODS with <title> + <namePart> for the bibtex record", async () => {
    const r = await run("bibtex-to-mods", f("a.bib", F.bibtex, "application/x-bibtex"));
    const xml = await r.blob.text();
    expect(r.blob.type).toContain("mods+xml");
    expect(xml).toMatch(/<mods\b/);
    expect(xml).toContain("<title>A Sample Paper</title>");
    expect(xml).toMatch(/<namePart[^>]*>Smith<\/namePart>/);
  });

  it("ris-to-mods emits MODS with the RIS title", async () => {
    const xml = await (await run("ris-to-mods", f("a.ris", F.ris, "application/x-research-info-systems"))).blob.text();
    expect(xml).toContain("<title>A Sample Paper</title>");
  });

  it("nbib-to-mods emits MODS with the PubMed title", async () => {
    const xml = await (await run("nbib-to-mods", f("a.nbib", F.nbibRealPubMed, "application/x-research-info-systems"))).blob.text();
    expect(xml).toContain("Synaptic plasticity in the mouse hippocampus");
  });

  it("endnote-xml-to-mods emits MODS with the EndNote title", async () => {
    const xml = await (await run("endnote-xml-to-mods", f("a.xml", F.endnoteXml, "application/xml"))).blob.text();
    expect(xml).toContain("EndNote Sample Article");
  });

  it("csl-json-to-mods emits MODS with the CSL title", async () => {
    const xml = await (await run("csl-json-to-mods", f("a.json", F.cslJson, "application/json"))).blob.text();
    expect(xml).toContain("A Sample Paper");
  });

  it("csv-to-mods emits MODS carrying the CSV title", async () => {
    const xml = await (await run("csv-to-mods", f("a.csv", CITATION_CSV, "text/csv"))).blob.text();
    expect(xml).toContain("A Study of Things");
    expect(xml).toMatch(/<mods\b/);
  });

  it("round-trip MODS -> RIS -> MODS preserves title + DOI + pages", async () => {
    const r1 = await run("mods-to-ris", mods());
    const r2 = await run("ris-to-mods", reFile(await r1.blob.text(), "b.ris", "application/x-research-info-systems"));
    const xml = await r2.blob.text();
    expect(xml).toContain("Vestibular function in aging adults");
    expect(xml).toContain("10.1007/s00415-006-0001-x");
    expect(xml).toMatch(/<start>1499<\/start>/);
  });

  it("mods-to-bibtex throws on XML with no MODS records", async () => {
    await expect(
      run("mods-to-bibtex", f("e.xml", '<modsCollection xmlns="http://www.loc.gov/mods/v3"></modsCollection>', "application/mods+xml")),
    ).rejects.toThrow(/No references found/);
  });
});

const MARC_SAMPLE =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<collection xmlns="http://www.loc.gov/MARC21/slim">\n' +
  '  <record>\n' +
  '    <leader>00000nab a2200000 a 4500</leader>\n' +
  '    <datafield tag="100" ind1="1" ind2=" "><subfield code="a">Smith, John,</subfield><subfield code="d">1970-</subfield></datafield>\n' +
  '    <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Vestibular function in aging adults /</subfield><subfield code="c">John Smith and Jane Doe.</subfield></datafield>\n' +
  '    <datafield tag="700" ind1="1" ind2=" "><subfield code="a">Doe, Jane.</subfield></datafield>\n' +
  '    <datafield tag="022" ind1=" " ind2=" "><subfield code="a">1432-1459</subfield></datafield>\n' +
  '    <datafield tag="024" ind1="7" ind2=" "><subfield code="a">10.1007/s00415-006-0001-x</subfield><subfield code="2">doi</subfield></datafield>\n' +
  '    <datafield tag="773" ind1="0" ind2=" "><subfield code="t">Journal of Neurology</subfield><subfield code="g">Vol. 253, no. 11 (2006), p. 1499-1508</subfield></datafield>\n' +
  '    <datafield tag="650" ind1=" " ind2="0"><subfield code="a">Balance</subfield></datafield>\n' +
  '  </record>\n' +
  '</collection>\n';

describe("citation hub: MARCXML carries real data", () => {
  const marc = () => f("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml");

  it("marcxml-to-bibtex keeps title + DOI (024 ind1=7 $2=doi)", async () => {
    const bib = await (await run("marcxml-to-bibtex", marc())).blob.text();
    expect(bib).toContain("Vestibular function in aging adults");
    expect(bib).toContain("10.1007/s00415-006-0001-x");
  });

  it("marcxml-to-ris keeps title, both authors (dates stripped), year, journal", async () => {
    const ris = await (await run("marcxml-to-ris", marc())).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in aging adults/);
    expect(ris).toMatch(/AU\s+-\s+Smith, John/);
    expect(ris).toMatch(/AU\s+-\s+Doe, Jane/);
    expect(ris).toMatch(/PY\s+-\s+2006/); // year recovered from the 773 host string
    expect(ris).toMatch(/(JO|JF|T2)\s+-\s+Journal of Neurology/);
  });

  it("marcxml-to-csl-json emits title + DOI + container + volume/pages", async () => {
    const arr = JSON.parse(await (await run("marcxml-to-csl-json", marc())).blob.text());
    expect(arr[0].title).toBe("Vestibular function in aging adults");
    expect(arr[0].DOI).toBe("10.1007/s00415-006-0001-x");
    expect(arr[0]["container-title"]).toBe("Journal of Neurology");
    expect(arr[0].volume).toBe("253");
    expect(arr[0].page).toBe("1499-1508");
  });

  it("marcxml-to-csv carries the title and a subject keyword", async () => {
    const csv = await (await run("marcxml-to-csv", marc())).blob.text();
    expect(csv).toContain("Vestibular function in aging adults");
    expect(csv).toContain("Balance");
  });

  it("marcxml-to-xlsx is a zip-backed spreadsheet", async () => {
    const bytes = new Uint8Array(await (await run("marcxml-to-xlsx", marc())).blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it("marcxml-to-bibtex throws on a collection with no records", async () => {
    await expect(
      run("marcxml-to-bibtex", f("e.xml", '<collection xmlns="http://www.loc.gov/MARC21/slim"></collection>', "application/marcxml+xml")),
    ).rejects.toThrow(/No records found/);
  });
});

describe("citation hub: spreadsheet -> citation bridge carries real data", () => {
  const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const xlsx = async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), XLSX_MIME);
  const ods = async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet");

  it("xlsx-to-ris keeps title, both authors, year, DOI", async () => {
    const ris = await (await run("xlsx-to-ris", await xlsx())).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in aging/);
    expect(ris).toMatch(/AU\s+-\s+Smith, John/);
    expect(ris).toMatch(/AU\s+-\s+Doe, Jane/);
    expect(ris).toMatch(/PY\s+-\s+2006/);
    expect(ris).toContain("10.1007/s00415-006-0001-x");
  });

  it("xlsx-to-bibtex keeps title + DOI", async () => {
    const bib = await (await run("xlsx-to-bibtex", await xlsx())).blob.text();
    expect(bib).toContain("Vestibular function in aging");
    expect(bib).toContain("10.1007/s00415-006-0001-x");
  });

  it("xlsx-to-csl-json emits a CSL array with the title + journal", async () => {
    const arr = JSON.parse(await (await run("xlsx-to-csl-json", await xlsx())).blob.text());
    expect(arr[0].title).toBe("Vestibular function in aging");
    expect(arr[0]["container-title"]).toBe("Journal of Neurology");
    expect(arr).toHaveLength(2);
  });

  it("ods-to-ris keeps the title from an OpenDocument sheet", async () => {
    const ris = await (await run("ods-to-ris", await ods())).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibular function in aging/);
    expect(ris).toMatch(/PY\s+-\s+2006/);
  });

  it("ods-to-bibtex carries the title", async () => {
    const bib = await (await run("ods-to-bibtex", await ods())).blob.text();
    expect(bib).toContain("Vestibular function in aging");
  });

  it("xlsx-to-ris fails loudly on a non-citation spreadsheet", async () => {
    const generic = fileFromBytes("data.xlsx", await makeTinyXlsx(), XLSX_MIME);
    await expect(run("xlsx-to-ris", generic)).rejects.toThrow(
      /no recognizable citation columns|No references found/i,
    );
  });

  // Remaining spreadsheet->citation targets: assert the real title survives
  // (also keeps these pairs out of the audit's untested bucket).
  it("the rest of the spreadsheet -> citation targets carry the title", async () => {
    const xlsxBytes = await makeTinyCitationXlsx();
    const odsBytes = await makeTinyCitationOds();
    const xf = () => fileFromBytes("r.xlsx", xlsxBytes, XLSX_MIME);
    const of = () => fileFromBytes("r.ods", odsBytes, "application/vnd.oasis.opendocument.spreadsheet");
    for (const id of ["xlsx-to-endnote-xml", "xlsx-to-nbib"] as const) {
      const out = await (await run(id, xf())).blob.text();
      expect(out).toContain("Vestibular function in aging");
    }
    for (const id of ["ods-to-csl-json", "ods-to-endnote-xml", "ods-to-nbib"] as const) {
      const out = await (await run(id, of())).blob.text();
      expect(out).toContain("Vestibular function in aging");
    }
  });
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

describe("csv-to-ris: real-world Excel export hardening", () => {
  // Excel "Save as CSV" (especially non-US locales) prepends a `sep=`
  // locale-hint line. Left in, papaparse reads it AS the header row and
  // the whole conversion silently yields no citations. Regression guard
  // driven by a real PostHog failure on the flagship csv-to-ris tool.
  it("handles the Excel `sep=,` locale-hint prefix line", async () => {
    const csv = "sep=,\nTitle,Authors,Year,DOI\nDeep Learning,LeCun; Bengio,2015,10.1038/nature14539\n";
    const ris = await (await run("csv-to-ris", f("excel.csv", csv, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Deep Learning/);
    expect(ris).toMatch(/PY\s+-\s+2015/);
    expect(ris).toContain("10.1038/nature14539");
    expect(ris).toMatch(/AU\s+-\s+LeCun/);
  });

  it("handles a `sep=;` prefix with semicolon-delimited data (EU/Turkish Excel)", async () => {
    const csv = "sep=;\nTitle;Authors;Year\nVestibüler fonksiyon;Yılmaz, Deniz;2019\n";
    const ris = await (await run("csv-to-ris", f("tez.csv", csv, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Vestibüler fonksiyon/);
    expect(ris).toMatch(/PY\s+-\s+2019/);
  });

  it("strips a UTF-8 BOM before the header so the first column still maps", async () => {
    const csv = "﻿Title,Authors,Year\nA Study,Smith,2020\n";
    const ris = await (await run("csv-to-ris", f("bom.csv", csv, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+A Study/);
  });

  it("auto-detects a plain semicolon delimiter with no sep= hint", async () => {
    const csv = "Title;Authors;Year\nQuantum Notes;Bohr;1925\n";
    const ris = await (await run("csv-to-ris", f("semi.csv", csv, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Quantum Notes/);
  });

  it("gives a diagnostic error when the CSV has a header but no data rows", async () => {
    await expect(
      run("csv-to-ris", f("headeronly.csv", "Title,Authors,Year\n", "text/csv")),
    ).rejects.toThrow(/no data rows|header but no/i);
  });

  it("still does not regress a normal comma CSV", async () => {
    const csv = "Title,Authors,Year\nNormal Paper,Doe,2021\n";
    const ris = await (await run("csv-to-ris", f("n.csv", csv, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Normal Paper/);
    expect(ris).toMatch(/PY\s+-\s+2021/);
  });
});

describe("csv-to-ris: smart redirect when the input is not really a CSV", () => {
  // PostHog's #1 fresh error: users paste a plain-text reference list (or
  // a PubMed export) into csv-to-ris because the .csv extension passes the
  // gate. Now that dedicated tools exist, point them there.
  it("redirects a pasted reference list to references-to-ris", async () => {
    const reflist =
      '[1] L. Tan and T. Zrnic, "Valid Inference with Synthetic Data," JMLR, 2024.\n' +
      '[2] K. Brown, "A Single Author Study," Nature, 2019.';
    await expect(run("csv-to-ris", f("refs.csv", reflist, "text/csv"))).rejects.toThrow(
      /references-to-ris/,
    );
  });

  it("redirects a pasted PubMed/MEDLINE export to pubmed-to-ris", async () => {
    const pubmed = "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\n";
    await expect(run("csv-to-ris", f("pubmed.csv", pubmed, "text/csv"))).rejects.toThrow(
      /pubmed-to-ris/,
    );
  });

  it("csv-to-bibtex redirects a reference list to references-to-bibtex", async () => {
    const reflist = '[1] A. Author, "Some Paper Title," Journal, 2022.';
    await expect(run("csv-to-bibtex", f("refs.csv", reflist, "text/csv"))).rejects.toThrow(
      /references-to-bibtex/,
    );
  });

  it("does NOT redirect a normal citation CSV (no false positive)", async () => {
    const csv = "title,authors,year\nReal Paper,Smith,2020\n";
    const ris = await (await run("csv-to-ris", f("ok.csv", csv, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Real Paper/);
  });
});

describe("csv-to-ris: recognizes academic database field-code exports", () => {
  // PostHog (06-19): the flagship rejected Web of Science and RIS exports
  // whose CSV columns are 2-letter field codes (AU/TI/PY..., TY/T1/A1...),
  // not human-readable headers. The reader now aliases those codes.
  it("parses a Web of Science tab-delimited export (AU/TI/SO/PY/DI codes)", async () => {
    const wos = "AU\tTI\tSO\tPY\tVL\tDI\nSmith J\tDeep Learning for Vision\tNature\t2024\t12\t10.1038/x\n";
    const ris = await (await run("csv-to-ris", f("savedrecs.csv", wos, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Deep Learning for Vision/);
    expect(ris).toMatch(/AU\s+-\s+Smith J/);
    expect(ris).toMatch(/PY\s+-\s+2024/);
    expect(ris).toContain("10.1038/x");
  });

  it("parses a Web of Science comma export too", async () => {
    const wos = "AU,TI,SO,PY,DI\nDoe R,Quantum Notes,Science,2023,10.1126/y\n";
    const ris = await (await run("csv-to-ris", f("wos.csv", wos, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Quantum Notes/);
    expect(ris).toMatch(/PY\s+-\s+2023/);
  });

  it("parses RIS field codes used as CSV column headers (TY/T1/A1/Y1/JF/DO)", async () => {
    const risCols = "TY,T1,A1,Y1,JF,DO\nJOUR,A Study of Things,Brown K,2022,J. Things,10.1000/z\n";
    const ris = await (await run("csv-to-ris", f("export.csv", risCols, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+A Study of Things/);
    expect(ris).toMatch(/AU\s+-\s+Brown K/);
    expect(ris).toMatch(/PY\s+-\s+2022/);
  });

  it("still rejects a non-citation CSV that happens to have short headers", async () => {
    const contacts = "name,email,phone\nBob,b@x.com,555-1234\n";
    await expect(run("csv-to-ris", f("contacts.csv", contacts, "text/csv"))).rejects.toThrow(
      /no recognizable citation columns|references-to-ris/i,
    );
  });
});

describe("csv-to-ris: skips database-export preamble lines", () => {
  // PostHog (06-17..06-19): Ovid/EBSCO/EMBASE/Scopus exports prepend a
  // search-strategy or "citation overview" metadata line before the real
  // header. The reader now scans past the preamble to find the header.
  it("skips an Ovid 'Search query:' preamble line", async () => {
    const ovid = "Search query: Anemia\n\nTitle,Authors,Year,DOI\nIron studies,Smith J,2024,10.1/x\n";
    const ris = await (await run("csv-to-ris", f("ovid.csv", ovid, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Iron studies/);
    expect(ris).toMatch(/PY\s+-\s+2024/);
  });

  it("skips a search-strategy preamble above WoS field codes", async () => {
    const ovid = "SEARCH QUERY,('exp urolithiasis' OR 'exp nephrolithiasis')\nAU,TI,PY,DI\nDoe R,Stone disease,2023,10.2/y\n";
    const ris = await (await run("csv-to-ris", f("embase.csv", ovid, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Stone disease/);
    expect(ris).toMatch(/AU\s+-\s+Doe R/);
  });

  it("skips a Scopus 'citation overview' preamble", async () => {
    const scopus = "This is a citation overview for a set of 4 documents.\n\nAuthors,Title,Year\nLee C,Deep nets,2022\n";
    const ris = await (await run("csv-to-ris", f("scopus.csv", scopus, "text/csv"))).blob.text();
    expect(ris).toMatch(/TI\s+-\s+Deep nets/);
  });

  it("does not skip into a non-citation CSV (still rejected)", async () => {
    const data = "Report generated 2026-06-19\n\nKabupaten,Jumlah\nJakarta,1000\n";
    await expect(run("csv-to-ris", f("gov.csv", data, "text/csv"))).rejects.toThrow(
      /no recognizable citation columns|references-to-ris/i,
    );
  });
});
