/**
 * Smoke tests for text-format converters.
 *
 * Each test runs the converter against a real fixture, asserts:
 *   - Conversion completes without throwing
 *   - Output blob has the expected MIME type
 *   - Output is non-empty
 *   - Output starts with the expected magic bytes / shape (e.g. CSV
 *     contains commas, JSON parses, BibTeX starts with `@`)
 *
 * This catches the "writes garbage but doesn't throw" failure mode at
 * CI time, the worst failure mode for a conversion site, since the
 * user gets a downloadable file but it's broken.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";
import { fileFromBytes, makeTinyAse, makeTinyAco, makeTinyZip, makeTinyDst, makeTinyPes, makeTinyJef, makeTinyStl } from "./fixtures/binary-fixtures";

/** Read a Blob's bytes once and assert the first N bytes match. */
async function expectMagicBytes(blob: Blob, magic: number[]) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  for (let i = 0; i < magic.length; i++) {
    expect(bytes[i], `byte ${i}: expected 0x${magic[i].toString(16)}, got 0x${bytes[i]?.toString(16)}`).toBe(magic[i]);
  }
}

async function expectTextStartsWith(blob: Blob, prefix: string) {
  const text = await blob.text();
  expect(text.startsWith(prefix), `expected text to start with '${prefix}', got '${text.slice(0, 80)}'`).toBe(true);
}

async function expectParseableJson(blob: Blob) {
  const text = await blob.text();
  expect(() => JSON.parse(text)).not.toThrow();
}

async function expectCsvShape(blob: Blob, requiredColumns: string[]) {
  const text = await blob.text();
  const firstLine = text.split(/\r?\n/)[0];
  for (const col of requiredColumns) {
    expect(firstLine.toLowerCase()).toContain(col.toLowerCase());
  }
}

describe("text-format converter smoke tests", () => {
  // ===== Finance =====
  it("ofx-to-csv produces a CSV with expected columns", async () => {
    const input = fileFromText("test.ofx", FIXTURES.ofx, "application/x-ofx");
    const result = await run("ofx-to-csv", input);
    expect(result.blob.type).toContain("csv");
    await expectCsvShape(result.blob, ["Date", "Amount", "Payee"]);
  });

  it("qif-to-csv produces a CSV", async () => {
    const input = fileFromText("test.qif", FIXTURES.qif, "application/qif");
    const result = await run("qif-to-csv", input);
    expect(result.blob.type).toContain("csv");
    await expectCsvShape(result.blob, ["Date", "Amount"]);
  });

  it("csv-to-ofx produces an OFX 2.x XML file", async () => {
    const input = fileFromText("test.csv", FIXTURES.bankCsv, "text/csv");
    const result = await run("csv-to-ofx", input);
    await expectTextStartsWith(result.blob, "<?xml");
    expect(await result.blob.text()).toContain("<OFX>");
  });

  it("csv-to-qif produces a QIF file", async () => {
    const input = fileFromText("test.csv", FIXTURES.bankCsv, "text/csv");
    const result = await run("csv-to-qif", input);
    await expectTextStartsWith(result.blob, "!Type:");
  });

  // ===== Bibliography =====
  it("bibtex-to-ris produces a valid-looking RIS file", async () => {
    const input = fileFromText("test.bib", FIXTURES.bibtex, "application/x-bibtex");
    const result = await run("bibtex-to-ris", input);
    const text = await result.blob.text();
    expect(text).toContain("TY  - JOUR");
    expect(text).toContain("ER  -");
  });

  it("ris-to-bibtex produces a valid-looking BibTeX file", async () => {
    const input = fileFromText("test.ris", FIXTURES.ris, "application/x-research-info-systems");
    const result = await run("ris-to-bibtex", input);
    const text = await result.blob.text();
    expect(text).toMatch(/^@\w+\{/);
  });

  it("nbib-to-bibtex parses NBIB and emits BibTeX", async () => {
    const input = fileFromText("test.nbib", FIXTURES.nbib, "application/x-research-info-systems");
    const result = await run("nbib-to-bibtex", input);
    const text = await result.blob.text();
    expect(text).toMatch(/^@\w+\{/);
  });

  // Regression for a production failure caught via PostHog convert_error
  // on /nbib-to-ris (2026-05-11): real PubMed NBIB exports have PT after
  // the data fields and multiple PT lines per record. The old parser
  // treated PT as a record-start marker so it dropped every field before
  // PT and wiped records on each repeat. Result: zero citations.
  //
  // This test uses a faithful PubMed export shape and asserts real data
  // survives end-to-end, not just that the output has RIS markers.
  it("nbib-to-ris preserves real PubMed data (regression for PT-after-data)", async () => {
    const input = fileFromText(
      "real.nbib",
      FIXTURES.nbibRealPubMed,
      "application/x-research-info-systems",
    );
    const result = await run("nbib-to-ris", input);
    const text = await result.blob.text();

    // Both records made it through (not zero, not one).
    expect(text.match(/^TY\s+- /gm)?.length).toBe(2);
    expect(text.match(/^ER\s+- ?/gm)?.length).toBe(2);

    // Record 1 fields survived even though PT appears late and twice.
    expect(text).toContain("Synaptic plasticity in the mouse hippocampus");
    expect(text).toContain("Smith"); // FAU author
    expect(text).toContain("Doe"); // second author
    expect(text).toContain("2018"); // DP year
    expect(text).toContain("1499"); // page range start
    expect(text).toContain("10.1038/s41593-018-0244-8"); // DOI from [doi]-tagged LID

    // Record 2 fields survived; second record uses a blank-line separator
    // (no ER terminator on record 1).
    expect(text).toContain("CRISPR off-target");
    expect(text).toContain("Garcia");
    expect(text).toContain("2019");
    expect(text).toContain("10.1038/s41586-019-0001-2");

    // PII identifier from record 1 must NOT be stored as the DOI: the
    // [pii] tag means it's a publisher item ID, not a DOI. Catches the
    // regression where AID values got blindly assigned to the DOI field.
    expect(text).not.toContain("S1097-6256(18)30001-1");
  });

  it("nbib-to-bibtex preserves real PubMed data (regression for PT-after-data)", async () => {
    const input = fileFromText(
      "real.nbib",
      FIXTURES.nbibRealPubMed,
      "application/x-research-info-systems",
    );
    const result = await run("nbib-to-bibtex", input);
    const text = await result.blob.text();
    // Two @entries (one per NBIB record).
    expect(text.match(/^@\w+\{/gm)?.length).toBe(2);
    expect(text).toContain("Synaptic plasticity in the mouse hippocampus");
    expect(text).toContain("CRISPR off-target");
    expect(text).toContain("10.1038/s41593-018-0244-8");
    expect(text).toContain("10.1038/s41586-019-0001-2");
  });

  it("endnote-xml-to-bibtex parses EndNote XML", async () => {
    const input = fileFromText("test.xml", FIXTURES.endnoteXml, "application/xml");
    const result = await run("endnote-xml-to-bibtex", input);
    const text = await result.blob.text();
    expect(text).toContain("@article");
  });

  it("bibtex-to-csv emits a CSV", async () => {
    const input = fileFromText("test.bib", FIXTURES.bibtex, "application/x-bibtex");
    const result = await run("bibtex-to-csv", input);
    await expectCsvShape(result.blob, ["title", "authors", "year"]);
  });

  it("csv-to-bibtex round-trips back to BibTeX", async () => {
    // First make the CSV from BibTeX so we know it's well-formed.
    const bibtexInput = fileFromText("test.bib", FIXTURES.bibtex, "application/x-bibtex");
    const csv = await run("bibtex-to-csv", bibtexInput);
    const csvFile = new File([await csv.blob.arrayBuffer()], "out.csv", { type: "text/csv" });
    const result = await run("csv-to-bibtex", csvFile);
    expect(await result.blob.text()).toMatch(/^@\w+\{/);
  });

  // ===== GEDCOM =====
  it("gedcom-to-json parses a GEDCOM and emits valid JSON", async () => {
    const input = fileFromText("test.ged", FIXTURES.gedcom, "text/plain");
    const result = await run("gedcom-to-json", input);
    await expectParseableJson(result.blob);
    const parsed = JSON.parse(await result.blob.text());
    expect(parsed.individuals.length).toBe(2);
    expect(parsed.families.length).toBe(1);
  });

  it("gedcom-to-csv emits a flat individuals CSV", async () => {
    const input = fileFromText("test.ged", FIXTURES.gedcom, "text/plain");
    const result = await run("gedcom-to-csv", input);
    await expectCsvShape(result.blob, ["id", "name", "sex"]);
  });

  it("json-to-gedcom round-trips from gedcom-to-json output", async () => {
    const input = fileFromText("test.ged", FIXTURES.gedcom, "text/plain");
    const json = await run("gedcom-to-json", input);
    const jsonFile = new File([await json.blob.arrayBuffer()], "out.json", { type: "application/json" });
    const result = await run("json-to-gedcom", jsonFile);
    const text = await result.blob.text();
    expect(text).toContain("0 HEAD");
    expect(text).toContain("0 @I1@ INDI");
    expect(text).toContain("0 TRLR");
  });

  // ===== ADIF + Cabrillo =====
  it("adif-to-csv parses ADIF and emits a CSV with CALL column", async () => {
    const input = fileFromText("test.adi", FIXTURES.adif, "application/x-adif");
    const result = await run("adif-to-csv", input);
    await expectCsvShape(result.blob, ["CALL"]);
  });

  it("cabrillo-to-adif parses a Cabrillo log", async () => {
    const input = fileFromText("test.log", FIXTURES.cabrillo, "text/plain");
    const result = await run("cabrillo-to-adif", input);
    const text = await result.blob.text();
    expect(text).toContain("<EOH>");
    expect(text).toContain("<EOR>");
  });

  it("adif-to-cabrillo emits a Cabrillo-formatted log", async () => {
    const input = fileFromText("test.adi", FIXTURES.adif, "application/x-adif");
    const result = await run("adif-to-cabrillo", input);
    const text = await result.blob.text();
    expect(text).toContain("START-OF-LOG:");
    expect(text).toContain("END-OF-LOG:");
    expect(text).toMatch(/^QSO: /m);
  });

  // ===== Discord chat =====
  it("discord-chat-to-md produces Markdown with author headings", async () => {
    const input = fileFromText("export.json", FIXTURES.discordChat, "application/json");
    const result = await run("discord-chat-to-md", input);
    const text = await result.blob.text();
    expect(text).toContain("# Discord Chat");
    expect(text).toContain("**Alice**");
    expect(text).toContain("**Bob**");
  });

  it("discord-chat-summary-csv tallies per-author counts", async () => {
    const input = fileFromText("export.json", FIXTURES.discordChat, "application/json");
    const result = await run("discord-chat-summary-csv", input);
    await expectCsvShape(result.blob, ["author", "messageCount"]);
    const text = await result.blob.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
  });

  // ===== SARIF =====
  it("sarif-to-csv extracts findings", async () => {
    const input = fileFromText("scan.sarif", FIXTURES.sarif, "application/sarif+json");
    const result = await run("sarif-to-csv", input);
    await expectCsvShape(result.blob, ["ruleId", "level", "message"]);
    const text = await result.blob.text();
    expect(text).toContain("R001");
  });

  it("sarif-to-html emits a self-contained HTML report", async () => {
    const input = fileFromText("scan.sarif", FIXTURES.sarif, "application/sarif+json");
    const result = await run("sarif-to-html", input);
    const text = await result.blob.text();
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain("R001");
  });

  // ===== EDI =====
  it("edi-to-csv parses X12 segments", async () => {
    const input = fileFromText("test.edi", FIXTURES.ediX12, "application/edi-x12");
    const result = await run("edi-to-csv", input);
    const text = await result.blob.text();
    expect(text).toContain("Segment");
    expect(text).toContain("ISA");
  });

  it("edifact-to-csv parses EDIFACT segments", async () => {
    const input = fileFromText("test.edi", FIXTURES.edifact, "application/edifact");
    const result = await run("edifact-to-csv", input);
    const text = await result.blob.text();
    expect(text).toContain("Segment");
    expect(text).toContain("UNB");
  });

  // ===== PACER =====
  it("pacer-docket-to-csv extracts entries from a docket page", async () => {
    const input = fileFromText("docket.html", FIXTURES.pacerDocket, "text/html");
    const result = await run("pacer-docket-to-csv", input);
    await expectCsvShape(result.blob, ["date", "description"]);
    const text = await result.blob.text();
    expect(text).toContain("COMPLAINT");
    expect(text).toContain("SUMMONS");
  });

  // ===== Kindle =====
  it("kindle-clippings-to-json extracts the right number of clippings", async () => {
    const input = fileFromText("My Clippings.txt", FIXTURES.kindleClippings, "text/plain");
    const result = await run("kindle-clippings-to-json", input);
    const parsed = JSON.parse(await result.blob.text());
    expect(parsed.length).toBe(2);
    expect(parsed[0].book).toContain("Sample Book");
  });

  it("kindle-clippings-to-csv has a CSV with book column", async () => {
    const input = fileFromText("My Clippings.txt", FIXTURES.kindleClippings, "text/plain");
    const result = await run("kindle-clippings-to-csv", input);
    await expectCsvShape(result.blob, ["book", "author"]);
  });

  // ===== WhatsApp =====
  it("whatsapp-chat-to-csv parses iOS-style WhatsApp export", async () => {
    const input = fileFromText("_chat.txt", FIXTURES.whatsappChat, "text/plain");
    const result = await run("whatsapp-chat-to-csv", input);
    await expectCsvShape(result.blob, ["timestamp", "sender", "text"]);
    const text = await result.blob.text();
    expect(text).toContain("Alice");
  });

  // ===== EML =====
  it("eml-to-csv extracts headers", async () => {
    const input = fileFromText("test.eml", FIXTURES.eml, "message/rfc822");
    const result = await run("eml-to-csv", input);
    await expectCsvShape(result.blob, ["from", "to", "subject"]);
  });

  it("eml-to-mbox wraps an EML in mbox From-line format", async () => {
    const input = fileFromText("test.eml", FIXTURES.eml, "message/rfc822");
    const result = await run("eml-to-mbox", input);
    await expectTextStartsWith(result.blob, "From ");
  });

  // ===== Color palette =====
  it("hex-to-gpl converts a hex list to a GIMP palette", async () => {
    const input = fileFromText("colors.txt", FIXTURES.hexList, "text/plain");
    const result = await run("hex-to-gpl", input);
    await expectTextStartsWith(result.blob, "GIMP Palette");
  });

  it("hex-to-ase emits a binary ASE file", async () => {
    const input = fileFromText("colors.txt", FIXTURES.hexList, "text/plain");
    const result = await run("hex-to-ase", input);
    await expectMagicBytes(result.blob, [0x41, 0x53, 0x45, 0x46]); // "ASEF"
  });

  it("ase-to-gpl decodes our ASE writer output", async () => {
    const aseBytes = makeTinyAse();
    const input = fileFromBytes("palette.ase", aseBytes);
    const result = await run("ase-to-gpl", input);
    const text = await result.blob.text();
    expect(text).toContain("GIMP Palette");
    expect(text).toContain("Red");
  });

  it("aco-to-ase decodes ACO and re-encodes ASE", async () => {
    const acoBytes = makeTinyAco();
    const input = fileFromBytes("palette.aco", acoBytes);
    const result = await run("aco-to-ase", input);
    await expectMagicBytes(result.blob, [0x41, 0x53, 0x45, 0x46]);
  });

  // ===== LUT =====
  it("cube-to-3dl converts a CUBE LUT to 3DL", async () => {
    const input = fileFromText("test.cube", FIXTURES.cubeLut, "text/plain");
    const result = await run("cube-to-3dl", input);
    const text = await result.blob.text();
    // 3DL starts with the coordinate ladder line, should be space-separated integers
    const firstLine = text.split("\n")[0];
    expect(firstLine.split(/\s+/).every((tok) => /^\d+$/.test(tok))).toBe(true);
  });

  // ===== MusicXML =====
  it("musicxml-to-mxl wraps XML in a zip", async () => {
    const input = fileFromText("score.musicxml", FIXTURES.musicXml, "application/vnd.recordare.musicxml+xml");
    const result = await run("musicxml-to-mxl", input);
    // ZIP magic bytes: PK\x03\x04
    await expectMagicBytes(result.blob, [0x50, 0x4b, 0x03, 0x04]);
  });

  it("midi-to-musicxml smoke (skip, needs binary MIDI fixture)", () => {
    // MIDI is binary; we'd need a real MIDI fixture or generate one via
    // midi-file's writeMidi. Punt to a future binary-fixtures expansion.
  });

  // ===== Embroidery =====
  it("dst-to-pes round-trip with our own DST writer", async () => {
    const dstBytes = makeTinyDst();
    const input = fileFromBytes("design.dst", dstBytes);
    const result = await run("dst-to-pes", input);
    await expectMagicBytes(result.blob, [0x23, 0x50, 0x45, 0x53]); // "#PES"
  });

  it("pes-to-dst round-trip", async () => {
    const pesBytes = makeTinyPes();
    const input = fileFromBytes("design.pes", pesBytes);
    const result = await run("pes-to-dst", input);
    // DST has no fixed signature but the header is ASCII "LA:..."
    const text = (await result.blob.text()).slice(0, 16);
    expect(text.startsWith("LA:")).toBe(true);
  });

  it("jef-to-exp converts JEF embroidery to EXP", async () => {
    const jefBytes = makeTinyJef();
    const input = fileFromBytes("design.jef", jefBytes);
    const result = await run("jef-to-exp", input);
    // EXP has no formal magic but should be non-empty and end with 0x80 0x02
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(2);
    expect(bytes[bytes.length - 2]).toBe(0x80);
  });

  // ===== 3D mesh =====
  it("stl-to-obj converts a binary STL to OBJ text", async () => {
    const stlBytes = makeTinyStl();
    const input = fileFromBytes("cube.stl", stlBytes);
    const result = await run("stl-to-obj", input);
    const text = await result.blob.text();
    expect(text).toMatch(/^# /); // OBJ comment header
    expect(text).toContain("v ");
    expect(text).toContain("f ");
  });

  it("obj-to-stl round-trips back to binary STL", async () => {
    const stlBytes = makeTinyStl();
    const stlFile = fileFromBytes("cube.stl", stlBytes);
    const obj = await run("stl-to-obj", stlFile);
    const objFile = new File([await obj.blob.arrayBuffer()], "out.obj", { type: "model/obj" });
    const result = await run("obj-to-stl", objFile);
    // Binary STL has an 80-byte header + uint32 triangle count starting at byte 80.
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(84);
    const triCount = new DataView(bytes.buffer).getUint32(80, true);
    expect(triCount).toBe(12); // unit cube = 12 triangles
  });

  it("stl-to-3mf produces a zip with a model XML inside", async () => {
    const stlBytes = makeTinyStl();
    const input = fileFromBytes("cube.stl", stlBytes);
    const result = await run("stl-to-3mf", input);
    // 3MF is a zip
    await expectMagicBytes(result.blob, [0x50, 0x4b, 0x03, 0x04]);
  });

  it("3mf-to-obj decodes a 3MF (round-trip from stl-to-3mf)", async () => {
    const stlBytes = makeTinyStl();
    const stlFile = fileFromBytes("cube.stl", stlBytes);
    const threeMf = await run("stl-to-3mf", stlFile);
    const threeMfFile = new File([await threeMf.blob.arrayBuffer()], "cube.3mf", { type: "model/3mf" });
    const result = await run("3mf-to-obj", threeMfFile);
    expect(await result.blob.text()).toContain("v ");
  });

  // ===== iWork (extract preview from zip) =====
  it("pages-to-pdf throws gracefully on a zip with no preview.pdf", async () => {
    // We don't have a real .pages fixture; verify the error path is clean.
    const zipBytes = await makeTinyZip();
    const input = fileFromBytes("doc.pages", zipBytes);
    await expect(run("pages-to-pdf", input)).rejects.toThrow();
  });

  // ===== JSON ↔ CSV =====
  it("json-to-csv accepts an array of objects", async () => {
    const input = fileFromText("data.json", FIXTURES.jsonArray, "application/json");
    const result = await run("json-to-csv", input);
    await expectCsvShape(result.blob, ["name", "age"]);
  });

  it("csv-to-json round-trips", async () => {
    const input = fileFromText("data.csv", FIXTURES.genericCsv, "text/csv");
    const result = await run("csv-to-json", input);
    const parsed = JSON.parse(await result.blob.text());
    expect(parsed).toHaveLength(3);
    expect(parsed[0].name).toBe("Alice");
  });
});
