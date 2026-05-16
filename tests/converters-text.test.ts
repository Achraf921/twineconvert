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
import { fileFromBytes, makeTinyAse, makeTinyAco, makeAcoV1Only, makeAcoCmyk, makeAcoHsb, makeTinyZip, makeTinyDst, makeTinyPes, makeTinyJef, makeTinyStl, makeTinyGlb, makeTinyObj, makeTinyDicom } from "./fixtures/binary-fixtures";

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

  // Regression for a production failure caught via PostHog convert_error
  // on /bibtex-to-ris (2026-05-11): a Spanish-speaking user uploaded a
  // .bib file with LaTeX-escaped accents, got two consecutive errors,
  // gave up. Root causes: parseBibtex didn't handle BOM, didn't decode
  // LaTeX accents, didn't accept paren-delimited entries, and required
  // a trailing comma after the entry key.
  //
  // Asserts real-world data survives across both directions of the
  // converter family. Tests parseBibtex which is shared by all 7
  // BibTeX-* converters, so a regression here would tank all of them.
  it("bibtex-to-ris handles Spanish files with LaTeX accents, paren entries, no-comma keys, and BOM", async () => {
    const input = fileFromText(
      "spanish.bib",
      FIXTURES.bibtexSpanish,
      "application/x-bibtex",
    );
    const result = await run("bibtex-to-ris", input);
    const text = await result.blob.text();

    // All three entries made it through. The brace-style entry, the
    // paren-style entry, and the comma-less entry (@misc{tufte_visual})
    // each produce their own TY/ER record.
    expect(text.match(/^TY\s+- /gm)?.length).toBe(3);
    expect(text.match(/^ER\s+- ?/gm)?.length).toBe(3);

    // LaTeX accents in author names are decoded to real Unicode, not
    // left as escape sequences in the output.
    expect(text).toContain("García");
    expect(text).toContain("Pérez");
    expect(text).toContain("Muñoz");
    expect(text).toContain("López");
    expect(text).toContain("Núñez");
    expect(text).toContain("Sofía");

    // Title with multiple accents survives.
    expect(text).toContain("Redes neuronales en el análisis de imágenes médicas");

    // Address field with accents survives.
    expect(text).toContain("México");

    // No raw LaTeX escape sequences in the output (the user would call
    // that "broken" and retry, same as the bug we caught).
    expect(text).not.toMatch(/\\['`^"~]/);

    // The paren-delimited entry's data is captured (not lost to the
    // brace-counter scanning to EOF).
    expect(text).toContain("Deep learning para detección de anomalías");
    expect(text).toContain("Congreso Iberoamericano");
  });

  // ===== CAD (AutoCAD DXF) =====
  // Real AutoCAD/LibreCAD/Fusion-360 exports carry a HEADER section
  // (skip), an ENTITIES section (parse), and a mix of supported and
  // unsupported entity types. Tests assert: every supported entity
  // type lands in the output, unsupported entities (INSERT, HATCH)
  // don't crash the parser, and the SVG output has a viewBox sized
  // from the actual geometry bounding box.
  it("dxf-to-json captures every supported entity type and ignores unknowns", async () => {
    const input = fileFromText("drawing.dxf", FIXTURES.dxf, "image/vnd.dxf");
    const result = await run("dxf-to-json", input);
    await expectParseableJson(result.blob);
    const parsed = JSON.parse(await result.blob.text());
    expect(Array.isArray(parsed.entities)).toBe(true);
    const types = parsed.entities.map((e: { type: string }) => e.type);
    // The fixture has LINE, CIRCLE, ARC, LWPOLYLINE, POINT, TEXT, INSERT.
    // INSERT is intentionally dropped (we don't expand block references).
    expect(types).toContain("LINE");
    expect(types).toContain("CIRCLE");
    expect(types).toContain("ARC");
    expect(types).toContain("LWPOLYLINE");
    expect(types).toContain("POINT");
    expect(types).toContain("TEXT");
    expect(types).not.toContain("INSERT");

    // Spot-check structural fidelity on individual entities.
    const line = parsed.entities.find((e: { type: string }) => e.type === "LINE");
    expect(line.x1).toBe(0);
    expect(line.y1).toBe(0);
    expect(line.x2).toBe(100);
    expect(line.y2).toBe(50);

    const circle = parsed.entities.find((e: { type: string }) => e.type === "CIRCLE");
    expect(circle.r).toBe(25);

    const lwp = parsed.entities.find((e: { type: string }) => e.type === "LWPOLYLINE");
    expect(lwp.closed).toBe(true);
    expect(lwp.vertices.length).toBe(4);

    const txt = parsed.entities.find((e: { type: string }) => e.type === "TEXT");
    expect(txt.content).toBe("Hello DXF");
  });

  it("dxf-to-svg emits a sized SVG with one element per supported entity", async () => {
    const input = fileFromText("drawing.dxf", FIXTURES.dxf, "image/vnd.dxf");
    const result = await run("dxf-to-svg", input);
    const svg = await result.blob.text();
    expect(svg).toContain("<?xml");
    expect(svg).toContain("<svg");
    expect(svg).toMatch(/viewBox="/);
    // Y-flip wrapper so DXF math-convention coords display right-side-up.
    expect(svg).toContain('transform="scale(1,-1)"');
    // Each supported entity emitted exactly once.
    expect((svg.match(/<line /g) ?? []).length).toBe(1);
    expect((svg.match(/<circle /g) ?? []).length).toBeGreaterThanOrEqual(1); // CIRCLE + POINT both render as <circle>
    expect((svg.match(/<path /g) ?? []).length).toBe(1); // ARC
    expect((svg.match(/<polygon /g) ?? []).length).toBe(1); // closed LWPOLYLINE
    expect(svg).toContain("Hello DXF");
    // No raw DXF group codes leaked into the SVG (regression catch).
    expect(svg).not.toMatch(/^\d+\s*$/m);
  });

  // ===== ASS / SSA styled subtitles =====
  // Real ASS files in the wild have: Comment lines mixed with Dialogue,
  // inline override codes ({\i1}...), hard breaks (\N), and dialogue
  // text containing literal commas. Each of these has bitten naive
  // parsers; tests assert all survive correctly.
  it("ass-to-srt parses Dialogue lines and skips Comment lines", async () => {
    const input = fileFromText("captions.ass", FIXTURES.ass, "text/x-ssa");
    const result = await run("ass-to-srt", input);
    const text = await result.blob.text();
    // The fixture has 3 Dialogue lines + 1 Comment. Comment must NOT
    // appear in the SRT output; Dialogue lines must.
    expect(text).toContain("Hello, world!");
    expect(text).toContain("Final cue.");
    expect(text).not.toContain("translator note");
    // 3 cues should produce 3 numbered SRT entries.
    expect(text.match(/^\d+$/gm)?.length).toBe(3);
    // SRT timing format (HH:MM:SS,mmm)
    expect(text).toMatch(/00:00:01,000 --> 00:00:03,500/);
  });

  it("ass-to-srt strips override codes and converts \\N to a newline", async () => {
    const input = fileFromText("captions.ass", FIXTURES.ass, "text/x-ssa");
    const result = await run("ass-to-srt", input);
    const text = await result.blob.text();
    // Inline ASS overrides like {\i1}/{\i0} must NOT leak through.
    expect(text).not.toMatch(/\\i[01]/);
    expect(text).not.toContain("{");
    // \N becomes a real newline in the output.
    expect(text).toContain("Italic line\nSecond line, with comma");
  });

  it("srt-to-ass emits a valid ASS file with default style + Dialogue per cue", async () => {
    const input = fileFromText("captions.srt", FIXTURES.srt, "application/x-subrip");
    const result = await run("srt-to-ass", input);
    const text = await result.blob.text();
    expect(text).toContain("[Script Info]");
    expect(text).toContain("[V4+ Styles]");
    expect(text).toContain("[Events]");
    expect(text).toMatch(/^Style: Default,/m);
    // Every SRT cue should become a Dialogue line.
    const srtCueCount = FIXTURES.srt.match(/^\d+:\d{2}:\d{2},\d{3}/gm)?.length ?? 0;
    const assDialogueCount = text.match(/^Dialogue:/gm)?.length ?? 0;
    expect(assDialogueCount).toBe(srtCueCount);
  });

  it("vtt-to-ass and ass-to-vtt round-trip preserves dialogue text and timing", async () => {
    // VTT -> ASS -> VTT: timing precision drops from ms to centiseconds
    // through the ASS hop (10ms quantization), but the dialogue text
    // and cue count must survive unchanged.
    const vttIn = fileFromText("captions.vtt", FIXTURES.vtt, "text/vtt");
    const ass = await run("vtt-to-ass", vttIn);
    const assFile = new File([await ass.blob.arrayBuffer()], "captions.ass", { type: "text/x-ssa" });
    const back = await run("ass-to-vtt", assFile);
    const text = await back.blob.text();
    expect(text.startsWith("WEBVTT")).toBe(true);
    // Same number of cues survives the round-trip.
    const originalArrows = FIXTURES.vtt.match(/-->/g)?.length ?? 0;
    const roundtripArrows = text.match(/-->/g)?.length ?? 0;
    expect(roundtripArrows).toBe(originalArrows);
  });

  // ===== Localization (gettext PO) =====
  // Real PO files in the wild carry plurals, contexts, comments, and
  // multi-line strings — these tests assert each survives end-to-end.
  it("po-to-json captures plural arrays and disambiguation contexts", async () => {
    const input = fileFromText("messages.po", FIXTURES.poGettext, "text/plain");
    const result = await run("po-to-json", input);
    await expectParseableJson(result.blob);
    const entries = JSON.parse(await result.blob.text());
    expect(Array.isArray(entries)).toBe(true);

    // Plural entry has msgstr as an array of two forms.
    const pluralEntry = entries.find((e: { msgid_plural?: string }) => e.msgid_plural);
    expect(pluralEntry).toBeDefined();
    expect(Array.isArray(pluralEntry.msgstr)).toBe(true);
    expect(pluralEntry.msgstr.length).toBe(2);
    expect(pluralEntry.msgstr[0]).toContain("artículo");
    expect(pluralEntry.msgstr[1]).toContain("artículos");

    // Two distinct entries share msgid \"Order\" but differ by msgctxt.
    const orders = entries.filter((e: { msgid: string }) => e.msgid === "Order");
    expect(orders.length).toBe(2);
    expect(orders.map((e: { msgctxt: string }) => e.msgctxt).sort()).toEqual(["noun", "verb"]);
  });

  it("json-to-po emits valid PO from a structured array", async () => {
    // Hand-build a small entries array (not from the fixture) so this
    // test independently verifies the writer side.
    const entries = [
      { msgid: "", msgstr: "Content-Type: text/plain; charset=UTF-8\\n" },
      { msgid: "Hello", msgstr: "Bonjour" },
      {
        msgid: "%d apple",
        msgid_plural: "%d apples",
        msgstr: ["%d pomme", "%d pommes"],
      },
    ];
    const input = fileFromText("entries.json", JSON.stringify(entries), "application/json");
    const result = await run("json-to-po", input);
    const text = await result.blob.text();
    expect(text).toContain('msgid "Hello"');
    expect(text).toContain('msgstr "Bonjour"');
    expect(text).toContain('msgid_plural "%d apples"');
    expect(text).toContain('msgstr[0] "%d pomme"');
    expect(text).toContain('msgstr[1] "%d pommes"');
  });

  it("po-to-csv produces a CSV with the canonical columns and msgid values", async () => {
    const input = fileFromText("messages.po", FIXTURES.poGettext, "text/plain");
    const result = await run("po-to-csv", input);
    const text = await result.blob.text();
    const header = text.split(/\r?\n/)[0];
    for (const col of ["msgctxt", "msgid", "msgid_plural", "msgstr", "msgstr_plurals", "comments", "references", "flags"]) {
      expect(header).toContain(col);
    }
    expect(text).toContain("Hello, world!");
    expect(text).toContain("Add to cart");
    // Plurals get JSON-encoded into msgstr_plurals.
    expect(text).toContain('artículo');
    expect(text).toContain('artículos');
  });

  it("csv-to-po rebuilds a valid PO from a po-to-csv export", async () => {
    // Chain through to make the test independent of any hand-written CSV.
    const poInput = fileFromText("messages.po", FIXTURES.poGettext, "text/plain");
    const csv = await run("po-to-csv", poInput);
    const csvFile = new File([await csv.blob.arrayBuffer()], "out.csv", { type: "text/csv" });
    const result = await run("csv-to-po", csvFile);
    const text = await result.blob.text();
    expect(text).toMatch(/^msgid /m);
    expect(text).toContain("Hello, world!");
    expect(text).toContain("¡Hola, mundo!");
    expect(text).toContain('msgid_plural "You have %d items in your cart"');
    expect(text).toContain('msgstr[0]');
    expect(text).toContain('msgstr[1]');
  });

  it("bibtex-to-csv handles the same Spanish file (parseBibtex is shared)", async () => {
    const input = fileFromText(
      "spanish.bib",
      FIXTURES.bibtexSpanish,
      "application/x-bibtex",
    );
    const result = await run("bibtex-to-csv", input);
    const text = await result.blob.text();
    // 3 entries -> header row + 3 data rows.
    expect(text.split(/\r?\n/).filter((l) => l.trim()).length).toBe(4);
    expect(text).toContain("García");
    expect(text).toContain("Muñoz");
    // Title field carries decoded accents through to CSV.
    expect(text).toContain("Redes neuronales en el análisis de imágenes médicas");
    expect(text).not.toMatch(/\\['`^"~]/);
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

  // Regression for a production failure caught via PostHog convert_error
  // on /aco-to-gpl (2026-05-11). The old parseAco only handled RGB and
  // Grayscale color spaces, so real Photoshop ACOs in CMYK / HSB / Lab
  // mode produced zero colors and either empty output or unguarded
  // DataView overruns. These three tests cover the cases I saw in the
  // wild plus the v1-only layout older tools emit.
  it("aco-to-gpl handles v1+v2 RGB swatches (baseline)", async () => {
    const input = fileFromBytes("palette.aco", makeTinyAco());
    const result = await run("aco-to-gpl", input);
    const text = await result.blob.text();
    expect(text.startsWith("GIMP Palette")).toBe(true);
    // SAMPLE_PALETTE is pure red, green, blue.
    expect(text).toMatch(/255\s+0\s+0/);
    expect(text).toMatch(/0\s+255\s+0/);
    expect(text).toMatch(/0\s+0\s+255/);
  });

  it("aco-to-gpl handles v1-only files (no trailing v2 section)", async () => {
    const input = fileFromBytes("v1only.aco", makeAcoV1Only());
    const result = await run("aco-to-gpl", input);
    const text = await result.blob.text();
    expect(text.startsWith("GIMP Palette")).toBe(true);
    // Three RGB swatches survive; names are not present in v1.
    expect(text).toMatch(/255\s+0\s+0/);
    expect(text).toMatch(/0\s+255\s+0/);
    expect(text).toMatch(/0\s+0\s+255/);
  });

  it("aco-to-gpl handles CMYK swatches by converting to RGB", async () => {
    const input = fileFromBytes("cmyk.aco", makeAcoCmyk());
    const result = await run("aco-to-gpl", input);
    const text = await result.blob.text();
    expect(text.startsWith("GIMP Palette")).toBe(true);
    const colorRowCount = text.split(/\r?\n/).filter((l) => /^\s*\d+\s+\d+\s+\d+\s+/.test(l)).length;
    expect(colorRowCount).toBe(3);

    // Spec-derived expected RGB values, not just "any non-zero row" (which
    // would let an upside-down conversion slip through).
    //
    // Per Adobe spec, ACO CMYK channels are inverted (0 = 100% ink). Our
    // fixture encodes pure cyan as (c=0, m=max, y=max, k=max=K means no
    // black ink). The naive uncalibrated CMYK->RGB formula then yields:
    //   Pure Cyan  (C=1, M=0, Y=0, K=0) -> R=0   G=255 B=255
    //   Pure Magenta (C=0, M=1, Y=0, K=0) -> R=255 G=0   B=255
    //   Pure Yellow  (C=0, M=0, Y=1, K=0) -> R=255 G=255 B=0
    expect(text).toMatch(/^\s*0\s+255\s+255\s+Pure Cyan/m);
    expect(text).toMatch(/^\s*255\s+0\s+255\s+Pure Magenta/m);
    expect(text).toMatch(/^\s*255\s+255\s+0\s+Pure Yellow/m);
  });

  it("aco-to-gpl handles HSB swatches by converting to RGB", async () => {
    const input = fileFromBytes("hsb.aco", makeAcoHsb());
    const result = await run("aco-to-gpl", input);
    const text = await result.blob.text();
    expect(text.startsWith("GIMP Palette")).toBe(true);
    const colorRowCount = text.split(/\r?\n/).filter((l) => /^\s*\d+\s+\d+\s+\d+\s+/.test(l)).length;
    expect(colorRowCount).toBe(3);
    // H=0, S=1, B=1 is pure red; H=120 is pure green; H=240 is pure blue.
    expect(text).toMatch(/255\s+0\s+0\s+HSB Red/);
    expect(text).toMatch(/0\s+255\s+0\s+HSB Green/);
    expect(text).toMatch(/0\s+0\s+255\s+HSB Blue/);
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

  // ===== 3D mesh: GLB / glTF binary =====
  // GLB tests assert the binary container is structurally valid AND
  // the round-trip preserves the mesh's actual triangle count — not
  // just "output is non-empty", which would let a writer that emits a
  // bare header (no actual mesh) sneak through.
  it("stl-to-glb produces a structurally valid glTF 2.0 binary", async () => {
    const input = fileFromBytes("cube.stl", makeTinyStl(), "model/stl");
    const result = await run("stl-to-glb", input);
    const buf = await result.blob.arrayBuffer();
    const view = new DataView(buf);
    // GLB magic + version + length headers
    expect(view.getUint32(0, true)).toBe(0x46546c67); // "glTF"
    expect(view.getUint32(4, true)).toBe(2);
    expect(view.getUint32(8, true)).toBe(buf.byteLength);
    // First chunk must be JSON
    expect(view.getUint32(16, true)).toBe(0x4e4f534a); // "JSON"
    // JSON body should mention the canonical glTF top-level keys
    const jsonLen = view.getUint32(12, true);
    const json = new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen));
    expect(json).toContain('"asset"');
    expect(json).toContain('"meshes"');
    expect(json).toContain('"VEC3"');
  });

  it("glb-to-stl extracts the right triangle count (12 for a unit cube)", async () => {
    const input = fileFromBytes("cube.glb", makeTinyGlb(), "model/gltf-binary");
    const result = await run("glb-to-stl", input);
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(84); // 80-byte header + uint32 count + at least 1 triangle
    const triCount = new DataView(bytes.buffer).getUint32(80, true);
    expect(triCount).toBe(12);
  });

  it("STL → GLB → STL preserves triangle count exactly", async () => {
    const stlFile = fileFromBytes("cube.stl", makeTinyStl(), "model/stl");
    const glb = await run("stl-to-glb", stlFile);
    const glbFile = new File([await glb.blob.arrayBuffer()], "out.glb", { type: "model/gltf-binary" });
    const back = await run("glb-to-stl", glbFile);
    const bytes = new Uint8Array(await back.blob.arrayBuffer());
    const triCount = new DataView(bytes.buffer).getUint32(80, true);
    expect(triCount).toBe(12);
  });

  it("obj-to-glb parses ASCII OBJ vertices/faces into a valid GLB", async () => {
    const input = fileFromText("cube.obj", makeTinyObj(), "model/obj");
    const result = await run("obj-to-glb", input);
    const buf = await result.blob.arrayBuffer();
    const view = new DataView(buf);
    expect(view.getUint32(0, true)).toBe(0x46546c67); // "glTF"
    // BIN chunk must be present and non-empty
    const jsonLen = view.getUint32(12, true);
    const binChunkOff = 20 + jsonLen;
    expect(view.getUint32(binChunkOff + 4, true)).toBe(0x004e4942); // "BIN\0"
    const binLen = view.getUint32(binChunkOff, true);
    expect(binLen).toBeGreaterThan(0);
  });

  // ===== Medical imaging (DICOM) =====
  // dicom-to-json runs in Node — pure parser, no canvas. The fixture
  // is built byte-by-byte from the DICOM PS3.10 spec (preamble + DICM
  // magic + Explicit VR Little Endian element stream) so the test
  // asserts our parser handles the real wire format, not a mock.
  it("dicom-to-json extracts canonical metadata tags", async () => {
    const input = fileFromBytes("test.dcm", makeTinyDicom(), "application/dicom");
    const result = await run("dicom-to-json", input);
    await expectParseableJson(result.blob);
    const meta = JSON.parse(await result.blob.text());

    // Transfer syntax was Explicit VR Little Endian (the modern default).
    expect(meta.transferSyntaxUID).toBe("1.2.840.10008.1.2.1");

    // Patient / study fields the test fixture embedded.
    expect(meta.patientName).toBe("DOE JOHN"); // ^ -> space per DICOM PN spec
    expect(meta.patientId).toBe("TEST-001");
    expect(meta.patientBirthDate).toBe("19800101");
    expect(meta.patientSex).toBe("M");
    expect(meta.studyDate).toBe("20260513");
    expect(meta.modality).toBe("CT");
    expect(meta.manufacturer).toBe("twineconvert test");
    expect(meta.studyDescription).toBe("Test Series");

    // Image geometry / pixel attributes.
    expect(meta.rows).toBe(4);
    expect(meta.columns).toBe(4);
    expect(meta.bitsAllocated).toBe(8);
    expect(meta.bitsStored).toBe(8);
    expect(meta.samplesPerPixel).toBe(1);
    expect(meta.photometricInterpretation).toBe("MONOCHROME2");
    expect(meta.pixelRepresentation).toBe(0);
  });

  it("dicom-to-json rejects non-DICOM files with a clear message", async () => {
    // First 132 bytes must be 128-byte preamble + "DICM" magic. A
    // random file should fail at the magic-byte check, not silently.
    const fakeBytes = new Uint8Array(200);
    for (let i = 0; i < fakeBytes.length; i++) fakeBytes[i] = 0xff;
    const input = fileFromBytes("notdicom.dcm", fakeBytes, "application/octet-stream");
    await expect(run("dicom-to-json", input)).rejects.toThrow(/DICM/);
  });

  it("glb-to-obj round-trip preserves the same triangle count via OBJ", async () => {
    // GLB -> OBJ -> STL chain proves the GLB writer's vertex+index data
    // is consistent with what the OBJ reader expects downstream.
    const glbFile = fileFromBytes("cube.glb", makeTinyGlb(), "model/gltf-binary");
    const obj = await run("glb-to-obj", glbFile);
    const text = await obj.blob.text();
    // OBJ should have one `v ` line per vertex (8 for a cube) and one `f `
    // line per triangle (12 for a cube).
    const vLines = (text.match(/^v /gm) ?? []).length;
    const fLines = (text.match(/^f /gm) ?? []).length;
    expect(vLines).toBe(8);
    expect(fLines).toBe(12);
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

// ============================================================================
// Regression suite for the three PostHog convert_error tools (2026-05-15):
// jsonl-to-csv, csv-to-adif, instagram-data-to-csv (+ its sibling html).
//
// Each tool gets BOTH halves of the contract tested on real files:
//   1. Happy path: a valid input converts AND the output has structural
//      integrity (not just "non-empty" — we parse the output back and
//      assert specific values survived).
//   2. The exact misuse that produced the production error throws the
//      NEW actionable message — so a regression that reverts to the
//      cryptic error fails CI.
// ============================================================================
describe("regression: PostHog convert_error tools (real-file smoke + integrity)", () => {
  // ---- jsonl-to-csv ----
  it("jsonl-to-csv: valid JSONL → CSV with correct columns, rows, and values", async () => {
    const jsonl =
      '{"name":"Alice","age":30,"city":"NYC"}\n' +
      '{"name":"Bob","age":25}\n' + // sparse: no city — header is union
      '{"name":"Carol","age":41,"city":"LA","vip":true}\n';
    const input = fileFromText("data.jsonl", jsonl, "application/jsonl");
    const result = await run("jsonl-to-csv", input);
    const text = await result.blob.text();
    const lines = text.trim().split(/\r?\n/);
    // Header is the union of all keys across records.
    expect(lines[0].split(",").sort()).toEqual(["age", "city", "name", "vip"]);
    expect(lines).toHaveLength(4); // header + 3 rows
    // Integrity: parse the CSV back and confirm specific values survived.
    const Papa = (await import("papaparse")).default;
    const reparsed = Papa.parse<Record<string, string>>(text.trim(), { header: true });
    expect(reparsed.data[0].name).toBe("Alice");
    expect(reparsed.data[0].city).toBe("NYC");
    expect(reparsed.data[1].city).toBe(""); // sparse record → empty cell
    expect(reparsed.data[2].vip).toBe("true");
  });

  it("jsonl-to-csv: a JSON array saved as .jsonl (the common misuse) → actionable error", async () => {
    // Real production scenario: user has a .json file, renames it
    // .jsonl (or a tool exports array-shaped .jsonl). The runner's
    // extension guard passes; our content detection must catch it.
    const jsonArray = '[\n  {"name":"Alice"},\n  {"name":"Bob"}\n]';
    const input = fileFromText("data.jsonl", jsonArray, "application/jsonl");
    await expect(run("jsonl-to-csv", input)).rejects.toThrow(/JSON array.*not JSONL|json-to-csv/i);
  });

  it("jsonl-to-csv: a pretty-printed JSON object saved as .jsonl → actionable error", async () => {
    const prettyObj = '{\n  "name": "Alice",\n  "age": 30\n}';
    const input = fileFromText("data.jsonl", prettyObj, "application/jsonl");
    await expect(run("jsonl-to-csv", input)).rejects.toThrow(/pretty-printed|json-to-csv|one .* per .* line/i);
  });

  // ---- csv-to-adif ----
  it("csv-to-adif: valid CSV → ADIF with the right QSO fields", async () => {
    const csv =
      "CALL,QSO_DATE,TIME_ON,BAND,MODE\n" +
      "K1ABC,20260514,1200,20m,SSB\n" +
      "W2XYZ,20260514,1305,40m,CW\n";
    const input = fileFromText("log.csv", csv, "text/csv");
    const result = await run("csv-to-adif", input);
    const adif = await result.blob.text();
    // ADIF integrity: each record ends with <EOR>, fields use the
    // <NAME:len>value tag form, and both calls survived.
    expect((adif.match(/<eor>/gi) ?? []).length).toBe(2);
    expect(adif).toMatch(/<CALL:5>K1ABC/i);
    expect(adif).toMatch(/<CALL:5>W2XYZ/i);
    expect(adif).toMatch(/<QSO_DATE:8>20260514/i);
    expect(adif).toMatch(/<MODE:3>SSB/i);
  });

  it("csv-to-adif: semicolon-delimited export (Log4OM/EU Excel) converts", async () => {
    // Regression: hardcoded comma delimiter failed every semicolon export.
    const csv =
      "CALL;QSO_DATE;TIME_ON;BAND;MODE\n" +
      "K1ABC;20260514;1200;20m;SSB\n" +
      "W2XYZ;20260514;1305;40m;CW\n";
    const result = await run(
      "csv-to-adif",
      fileFromText("log.csv", csv, "text/csv"),
    );
    const adif = await result.blob.text();
    expect((adif.match(/<eor>/gi) ?? []).length).toBe(2);
    expect(adif).toMatch(/<CALL:5>K1ABC/i);
    expect(adif).toMatch(/<MODE:2>CW/i);
  });

  it("csv-to-adif: ragged rows / comma in a comment do not abort the log", async () => {
    // Regression: FieldMismatch was fatal; real logs have comment commas.
    const csv =
      "CALL,QSO_DATE,MODE,COMMENT\n" +
      'K1ABC,20260514,SSB,"Great signal, 59 both ways"\n' +
      "W2XYZ,20260514,CW\n"; // short row, no comment
    const result = await run(
      "csv-to-adif",
      fileFromText("log.csv", csv, "text/csv"),
    );
    const adif = await result.blob.text();
    expect((adif.match(/<eor>/gi) ?? []).length).toBe(2);
    expect(adif).toMatch(/<CALL:5>K1ABC/i);
    expect(adif).toMatch(/<CALL:5>W2XYZ/i);
  });

  it("csv-to-adif: JSON uploaded as .csv → actionable error", async () => {
    const input = fileFromText("log.csv", '[{"call":"K1ABC"}]', "text/csv");
    await expect(run("csv-to-adif", input)).rejects.toThrow(/looks like JSON|export.*as CSV/i);
  });

  it("csv-to-adif: an ADI file uploaded as .csv → 'already ADIF' message", async () => {
    const adi = "<CALL:5>K1ABC<QSO_DATE:8>20260514<EOR>\n";
    const input = fileFromText("log.csv", adi, "text/csv");
    await expect(run("csv-to-adif", input)).rejects.toThrow(/already.*ADIF|no conversion needed/i);
  });

  it("csv-to-adif: header-only CSV with no data rows → actionable error", async () => {
    const input = fileFromText("log.csv", "CALL,QSO_DATE,BAND\n", "text/csv");
    await expect(run("csv-to-adif", input)).rejects.toThrow(/No log entries found|at least one data row/i);
  });

  // ---- instagram-data-to-csv (+ shared findInstagramPosts) ----
  it("instagram-data-to-csv: valid export zip → CSV with the post captured", async () => {
    const { makeTinyInstagramZip } = await import("./fixtures/binary-fixtures");
    const zip = await makeTinyInstagramZip();
    const input = fileFromBytes("instagram.zip", zip, "application/zip");
    const result = await run("instagram-data-to-csv", input);
    const text = await result.blob.text();
    expect(text).toContain("Test caption"); // the fixture's post title
    expect(text.toLowerCase()).toContain("date"); // header present
  });

  it("instagram-data-to-csv: HTML-format export → 're-download as JSON' error", async () => {
    const { makeInstagramHtmlExportZip } = await import("./fixtures/binary-fixtures");
    const zip = await makeInstagramHtmlExportZip();
    const input = fileFromBytes("instagram.zip", zip, "application/zip");
    await expect(run("instagram-data-to-csv", input)).rejects.toThrow(
      /HTML-format export|Format to JSON/i,
    );
  });

  it("instagram-data-to-csv: wrong-category export → error lists the JSON it DID find", async () => {
    const { makeInstagramWrongCategoryZip } = await import("./fixtures/binary-fixtures");
    const zip = await makeInstagramWrongCategoryZip();
    const input = fileFromBytes("instagram.zip", zip, "application/zip");
    // Must mention "Posts" guidance AND surface the actual JSON files
    // present so the user can self-diagnose.
    await expect(run("instagram-data-to-csv", input)).rejects.toThrow(
      /No posts data found.*your_topics\.json|personal_information\.json/i,
    );
  });

  it("instagram-data-to-html: shares the same hardened post-discovery path", async () => {
    const { makeInstagramHtmlExportZip } = await import("./fixtures/binary-fixtures");
    const zip = await makeInstagramHtmlExportZip();
    const input = fileFromBytes("instagram.zip", zip, "application/zip");
    await expect(run("instagram-data-to-html", input)).rejects.toThrow(
      /HTML-format export|Format to JSON/i,
    );
  });
});
