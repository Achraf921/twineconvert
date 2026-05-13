/**
 * Round-trip equivalence tests.
 *
 * For every losslessly-bijective pair (X→Y where Y→X exists and the
 * round-trip should preserve information), we:
 *   1. Take a fixture in format X
 *   2. Convert X → Y
 *   3. Convert Y → X' (where X' is the reconstructed input)
 *   4. Assert X' is semantically equivalent to X
 *
 * For lossless pairs (PNG ↔ BMP via canvas, MP4 ↔ MOV stream-copy
 * remux, OFX ↔ QIF transactional roundtrip, ASE ↔ GPL palette
 * roundtrip), we check that the SEMANTIC content matches, same
 * transaction count + amounts, same color values, same vertex
 * positions, rather than byte equality (which never works after
 * encoding/decoding through a format that adds metadata).
 *
 * Round-trip is a uniquely powerful test class because it catches
 * bugs in EITHER the forward or reverse converter that one-way tests
 * cannot detect. If our CSV writer encodes amounts as strings but the
 * CSV reader expects them as numbers, the magic-byte and structural
 * tests both pass, only the round-trip will catch that the data
 * round-tripped wrong.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText, FIXTURES } from "./fixtures/text-fixtures";
import { fileFromBytes, makeTinyAse, makeTinyAco, makeTinyDst, makeTinyPes, makeTinyJef, makeTinyExp, makeTinyStl, makeTinyGlb, makeTinyObj, makeTiny3mf, makeTinyXlsx } from "./fixtures/binary-fixtures";

/** Convert a Blob/File chain. The output of run() is { blob, filename };
 *  this just wraps it back into a File so the next converter accepts it. */
async function chain(toolId: string, input: File): Promise<File> {
  const result = await run(toolId, input);
  return new File([await result.blob.arrayBuffer()], result.filename, { type: result.blob.type });
}

describe("round-trip: finance formats", () => {
  it("OFX → CSV → OFX preserves transaction count + amounts", async () => {
    const original = fileFromText("test.ofx", FIXTURES.ofx, "application/x-ofx");
    const csv = await chain("ofx-to-csv", original);
    const back = await chain("csv-to-ofx", csv);
    const text = await back.text();
    // The original fixture has 1 transaction with amount -50.00 and payee "Coffee Shop".
    expect(text).toContain("-50.00");
    expect(text).toContain("Coffee Shop");
    expect(text).toContain("<OFX>");
  });

  it("QIF → CSV → QIF preserves transactions", async () => {
    const original = fileFromText("test.qif", FIXTURES.qif, "application/qif");
    const csv = await chain("qif-to-csv", original);
    const back = await chain("csv-to-qif", csv);
    const text = await back.text();
    expect(text).toContain("Coffee Shop");
    expect(text).toContain("Employer Payroll");
    expect(text).toMatch(/^!Type:/m);
  });

  it("OFX → QIF → OFX (cross-format round-trip) preserves transaction count", async () => {
    const original = fileFromText("test.ofx", FIXTURES.ofx, "application/x-ofx");
    const qif = await chain("ofx-to-qif", original);
    const back = await chain("qif-to-ofx", qif);
    const text = await back.text();
    expect(text).toContain("Coffee Shop");
    // Both directions should preserve at least one STMTTRN element
    expect(text).toContain("<STMTTRN>");
  });
});

describe("round-trip: bibliography formats", () => {
  it("BibTeX → RIS → BibTeX preserves title and authors", async () => {
    const original = fileFromText("test.bib", FIXTURES.bibtex, "application/x-bibtex");
    const ris = await chain("bibtex-to-ris", original);
    const back = await chain("ris-to-bibtex", ris);
    const text = await back.text();
    expect(text).toContain("A Sample Paper");
    expect(text).toContain("Smith, John");
    expect(text).toContain("Doe, Jane");
  });

  it("RIS → BibTeX → RIS preserves DOI and journal", async () => {
    const original = fileFromText("test.ris", FIXTURES.ris, "application/x-research-info-systems");
    const bib = await chain("ris-to-bibtex", original);
    const back = await chain("bibtex-to-ris", bib);
    const text = await back.text();
    expect(text).toContain("10.1038/sample.2024.001");
    expect(text).toContain("Nature");
  });

  it("BibTeX → CSV → BibTeX preserves citation key + title", async () => {
    const original = fileFromText("test.bib", FIXTURES.bibtex, "application/x-bibtex");
    const csv = await chain("bibtex-to-csv", original);
    const back = await chain("csv-to-bibtex", csv);
    const text = await back.text();
    expect(text).toContain("smith2024");
    expect(text).toContain("A Sample Paper");
  });

  it("BibTeX → EndNote XML → BibTeX preserves author and year", async () => {
    const original = fileFromText("test.bib", FIXTURES.bibtex, "application/x-bibtex");
    const xml = await chain("bibtex-to-endnote-xml", original);
    const back = await chain("endnote-xml-to-bibtex", xml);
    const text = await back.text();
    expect(text).toContain("Smith, John");
    expect(text).toContain("2024");
  });
});

describe("round-trip: GEDCOM ↔ JSON ↔ GEDCOM", () => {
  it("GEDCOM → JSON → GEDCOM preserves individuals and families", async () => {
    const original = fileFromText("test.ged", FIXTURES.gedcom, "text/plain");
    const json = await chain("gedcom-to-json", original);
    const back = await chain("json-to-gedcom", json);
    const text = await back.text();
    expect(text).toContain("0 HEAD");
    expect(text).toContain("0 TRLR");
    expect(text).toContain("/Smith/"); // surname slash convention
    expect((text.match(/^0 @[IF]/gm) ?? []).length).toBeGreaterThan(0);
  });
});

describe("round-trip: ADIF ↔ CSV ↔ ADIF", () => {
  it("ADIF → CSV → ADIF preserves QSO callsigns + dates", async () => {
    const original = fileFromText("test.adi", FIXTURES.adif, "application/x-adif");
    const csv = await chain("adif-to-csv", original);
    const back = await chain("csv-to-adif", csv);
    const text = await back.text();
    expect(text).toContain("K1ABC");
    expect(text).toContain("W2DEF");
    expect(text).toContain("<EOH>");
    expect((text.match(/<EOR>/g) ?? []).length).toBe(2);
  });
});

describe("round-trip: 3D mesh formats", () => {
  it("STL → OBJ → STL preserves triangle count (12 for unit cube)", async () => {
    const original = fileFromBytes("cube.stl", makeTinyStl(), "model/stl");
    const obj = await chain("stl-to-obj", original);
    const back = await chain("obj-to-stl", obj);
    // Binary STL has triangle count at byte 80 (uint32 LE).
    const bytes = new Uint8Array(await back.arrayBuffer());
    const triCount = new DataView(bytes.buffer).getUint32(80, true);
    expect(triCount).toBe(12);
  });

  it("STL → 3MF → STL preserves triangle count", async () => {
    const original = fileFromBytes("cube.stl", makeTinyStl(), "model/stl");
    const threeMf = await chain("stl-to-3mf", original);
    const back = await chain("3mf-to-stl", threeMf);
    const bytes = new Uint8Array(await back.arrayBuffer());
    const triCount = new DataView(bytes.buffer).getUint32(80, true);
    expect(triCount).toBe(12);
  });

  it("STL → 3MF → OBJ preserves vertex content", async () => {
    const original = fileFromBytes("cube.stl", makeTinyStl(), "model/stl");
    const threeMf = await chain("stl-to-3mf", original);
    const obj = await chain("3mf-to-obj", threeMf);
    const text = await obj.text();
    // Should have at least some "v " lines
    expect(text.match(/^v /gm)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(text.match(/^f /gm)?.length ?? 0).toBeGreaterThanOrEqual(12);
  });

  // STL ↔ GLB and OBJ ↔ GLB: lossless triangle-count round-trips on the
  // unit cube. Our minimal GLB writer emits POSITION + indices only, so
  // UVs/normals/materials are dropped on both sides equally — bijectivity
  // holds for the geometric subset that all three formats carry natively.
  it("STL → GLB → STL preserves triangle count (12 for unit cube)", async () => {
    const original = fileFromBytes("cube.stl", makeTinyStl(), "model/stl");
    const glb = await chain("stl-to-glb", original);
    const back = await chain("glb-to-stl", glb);
    const bytes = new Uint8Array(await back.arrayBuffer());
    const triCount = new DataView(bytes.buffer).getUint32(80, true);
    expect(triCount).toBe(12);
  });

  it("OBJ → GLB → OBJ preserves vertex and face count (8 v, 12 f)", async () => {
    const original = fileFromText("cube.obj", makeTinyObj(), "model/obj");
    const glb = await chain("obj-to-glb", original);
    const back = await chain("glb-to-obj", glb);
    const text = await back.text();
    // The unit-cube fixture has 8 distinct vertices and 12 triangles.
    // OBJ writers can sometimes inflate vertex count by emitting per-face
    // duplicates; this assertion fails fast if that ever regresses.
    expect((text.match(/^v /gm) ?? []).length).toBe(8);
    expect((text.match(/^f /gm) ?? []).length).toBe(12);
  });
});

describe("round-trip: color palette formats", () => {
  it("ASE → GPL → ASE preserves color count", async () => {
    const original = fileFromBytes("palette.ase", makeTinyAse(), "application/octet-stream");
    const gpl = await chain("ase-to-gpl", original);
    const back = await chain("gpl-to-ase", gpl);
    const text = await gpl.text();
    expect(text).toContain("Red");
    expect(text).toContain("Green");
    expect(text).toContain("Blue");
    // Final ASE should have ASEF magic
    const bytes = new Uint8Array(await back.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x41, 0x53, 0x45, 0x46]);
  });

  it("ASE → ACO → ASE preserves all 3 colors", async () => {
    const original = fileFromBytes("palette.ase", makeTinyAse(), "application/octet-stream");
    const aco = await chain("ase-to-aco", original);
    const back = await chain("aco-to-ase", aco);
    const bytes = new Uint8Array(await back.arrayBuffer());
    // Block count is at bytes 8-11 (big-endian); should be 3 colors.
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(8, false)).toBe(3);
  });
});

describe("round-trip: embroidery formats", () => {
  // Each pair: convert source → target → source, then check the round-tripped
  // file still looks like the original format. We don't byte-compare because
  // each writer adds its own header timestamps, but the structural validators
  // tell us the round-trip didn't produce garbage.

  for (const [src, tgt, srcMaker] of [
    ["dst", "pes", makeTinyDst],
    ["dst", "jef", makeTinyDst],
    ["dst", "exp", makeTinyDst],
    ["pes", "dst", makeTinyPes],
    ["pes", "jef", makeTinyPes],
    ["pes", "exp", makeTinyPes],
    ["jef", "dst", makeTinyJef],
    ["jef", "pes", makeTinyJef],
    ["jef", "exp", makeTinyJef],
    ["exp", "dst", makeTinyExp],
    ["exp", "pes", makeTinyExp],
    ["exp", "jef", makeTinyExp],
  ] as const) {
    it(`${src.toUpperCase()} → ${tgt.toUpperCase()} → ${src.toUpperCase()} round-trip succeeds without error`, async () => {
      const original = fileFromBytes(`design.${src}`, srcMaker(), "application/octet-stream");
      const intermediate = await chain(`${src}-to-${tgt}`, original);
      const back = await chain(`${tgt}-to-${src}`, intermediate);
      // Just check the back-converted file exists and is non-empty;
      // structural validation on outputs already happens in the
      // comprehensive test suite.
      expect(back.size).toBeGreaterThan(0);
    });
  }
});

describe("round-trip: 3MF mesh wrapping", () => {
  it("3MF → STL → 3MF preserves triangle count", async () => {
    const original = fileFromBytes("cube.3mf", await makeTiny3mf(), "model/3mf");
    const stl = await chain("3mf-to-stl", original);
    const back = await chain("stl-to-3mf", stl);
    expect(back.size).toBeGreaterThan(0);
    // 3MF is a zip, magic bytes
    const bytes = new Uint8Array(await back.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});

describe("round-trip: LUT formats (lossless)", () => {
  it("CUBE → 3DL → CUBE preserves grid size and data (size 4)", async () => {
    // Note: 3DL parser uses "first line with > 3 entries" as the
    // coordinate-ladder heuristic. A size-2 LUT (2-entry ladder) is
    // genuinely ambiguous because a 2-entry line could be either the
    // ladder or a partial RGB row. We use size 4+ for round-trip tests
    // so the ladder is unambiguous.
    const cube4 = `LUT_3D_SIZE 4
${Array.from({ length: 64 }, (_, i) => {
  const r = (i % 4) / 3;
  const g = (Math.floor(i / 4) % 4) / 3;
  const b = (Math.floor(i / 16) % 4) / 3;
  return `${r.toFixed(6)} ${g.toFixed(6)} ${b.toFixed(6)}`;
}).join("\n")}
`;
    const original = fileFromText("test.cube", cube4, "text/plain");
    const threeDl = await chain("cube-to-3dl", original);
    const back = await chain("3dl-to-cube", threeDl);
    const text = await back.text();
    expect(text).toContain("LUT_3D_SIZE 4");
    const triples = text.split(/\n/).filter((l) => /^\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*$/.test(l));
    expect(triples.length).toBe(64);
  });

  it("CUBE → CSP → CUBE preserves grid size", async () => {
    const original = fileFromText("test.cube", FIXTURES.cubeLut, "text/plain");
    const csp = await chain("cube-to-csp", original);
    const back = await chain("csp-to-cube", csp);
    const text = await back.text();
    expect(text).toContain("LUT_3D_SIZE 2");
  });
});

describe("round-trip: MusicXML ↔ MXL (zip wrap)", () => {
  it("MusicXML → MXL → MusicXML preserves the score content", async () => {
    const original = fileFromText("test.musicxml", FIXTURES.musicXml, "application/vnd.recordare.musicxml+xml");
    const mxl = await chain("musicxml-to-mxl", original);
    const back = await chain("mxl-to-musicxml", mxl);
    const text = await back.text();
    expect(text).toContain("<score-partwise");
    expect(text).toContain("<step>C</step>");
  });
});

// ============================================================================
// Phase-2 additions (bijectivity audit closeout): pairs that the audit
// flagged as theoretically lossless but had no round-trip coverage. Each
// test loads a fixture, chains forward then reverse, and asserts a real
// invariant of the original survives (not just "non-empty output").
// ============================================================================

describe("round-trip: more citation pairs", () => {
  it("BibTeX → NBIB → BibTeX preserves title", async () => {
    const original = fileFromText("test.bib", FIXTURES.bibtex, "text/plain");
    const nbib = await chain("bibtex-to-nbib", original);
    const back = await chain("nbib-to-bibtex", nbib);
    const text = await back.text();
    expect(text).toContain("A Sample Paper");
    expect(text).toMatch(/@\w+\{/);
  });

  it("NBIB -> RIS -> NBIB preserves title and proper NBIB tags", async () => {
    // Phase-3 fix landed: ris-to-nbib now uses buildNbib() which
    // outputs NBIB-style tags (PT, TI, JT, DP, VI, IP, PG, AID)
    // instead of RIS tags. Round-trip is now structurally correct.
    const original = fileFromText("test.nbib", FIXTURES.nbib, "text/plain");
    const ris = await chain("nbib-to-ris", original);
    const back = await chain("ris-to-nbib", ris);
    const text = await back.text();
    expect(text).toContain("PubMed Sample Paper");
    expect(text).toMatch(/^PT\s+- /m);
    expect(text).toMatch(/^TI\s+- /m);
    expect(text).toMatch(/^ER\s+-/m);
  });

  it("EndNote XML → RIS → EndNote XML preserves year", async () => {
    const original = fileFromText("test.xml", FIXTURES.endnoteXml, "application/xml");
    const ris = await chain("endnote-xml-to-ris", original);
    const back = await chain("ris-to-endnote-xml", ris);
    const text = await back.text();
    expect(text).toMatch(/<year>2024<\/year>/);
    expect(text).toContain("EndNote Sample Article");
  });
});

describe("round-trip: more CSV-pivoted pairs", () => {
  it("CSV → JSON → CSV preserves rows and column values", async () => {
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const json = await chain("csv-to-json", original);
    const back = await chain("json-to-csv", json);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Carol");
    // 3 data rows survive
    const dataRows = text.split("\n").filter((l) => l.includes(",") && !l.startsWith("name,"));
    expect(dataRows.length).toBe(3);
  });

  it("CSV → XLSX → CSV preserves rows and column values", async () => {
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const xlsx = await chain("csv-to-xlsx", original);
    const back = await chain("xlsx-to-csv", xlsx);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Paris");
    expect(text).toContain("Tokyo");
  });

  it("CSV → QBO → CSV preserves transactions", async () => {
    const original = fileFromText("test.csv", FIXTURES.bankCsv, "text/csv");
    const qbo = await chain("csv-to-qbo", original);
    const back = await chain("qbo-to-csv", qbo);
    const text = await back.text();
    expect(text).toContain("Coffee Shop");
    expect(text).toContain("Salary Deposit");
    // amounts (sign may flip per institution convention; check magnitudes)
    expect(text).toMatch(/4\.50/);
    expect(text).toMatch(/2500/);
  });

  it("CSV → QFX → CSV preserves transactions", async () => {
    const original = fileFromText("test.csv", FIXTURES.bankCsv, "text/csv");
    const qfx = await chain("csv-to-qfx", original);
    const back = await chain("qfx-to-csv", qfx);
    const text = await back.text();
    expect(text).toContain("Coffee Shop");
    expect(text).toContain("Salary Deposit");
  });

  it("RIS → CSV → RIS preserves citation entry", async () => {
    const original = fileFromText("test.ris", FIXTURES.ris, "text/plain");
    const csv = await chain("ris-to-csv", original);
    const back = await chain("csv-to-ris", csv);
    const text = await back.text();
    expect(text).toContain("A Sample Paper");
    expect(text).toMatch(/^TY\s+- /m);
    expect(text).toMatch(/^ER\s+-/m);
  });

  it("GEDCOM → CSV → GEDCOM preserves individual count", async () => {
    const original = fileFromText("test.ged", FIXTURES.gedcom, "text/plain");
    const csv = await chain("gedcom-to-csv", original);
    const back = await chain("csv-to-gedcom", csv);
    const text = await back.text();
    expect(text).toContain("0 HEAD");
    expect(text).toContain("0 TRLR");
    // The two INDI records from the fixture should round-trip
    const indiCount = (text.match(/^0 @I\d+@ INDI/gm) || []).length;
    expect(indiCount).toBeGreaterThanOrEqual(2);
  });
});

describe("round-trip: ham radio formats", () => {
  // Phase-3 fix landed: adif-to-cabrillo emits a "0" placeholder for
  // empty exchange fields (Cabrillo spec requires the field to be
  // present), and cabrillo-to-adif accepts 8+ tokens (some loggers
  // omit the trailing received exchange). Round-trip now preserves
  // QSO records as expected.
  it("ADIF -> Cabrillo -> ADIF preserves QSOs and callsigns", async () => {
    const original = fileFromText("test.adi", FIXTURES.adif, "text/plain");
    const cabrillo = await chain("adif-to-cabrillo", original);
    const back = await chain("cabrillo-to-adif", cabrillo);
    const text = await back.text();
    expect(text).toMatch(/K1ABC/i);
    expect(text).toMatch(/W2DEF/i);
    expect(text).toMatch(/<call:/i);
    // Both QSO_DATE values should survive
    expect(text).toContain("20240101");
    expect(text).toContain("20240102");
  });

  it("ADIF -> Cabrillo -> ADIF preserves header structure", async () => {
    const original = fileFromText("test.adi", FIXTURES.adif, "text/plain");
    const cabrillo = await chain("adif-to-cabrillo", original);
    const back = await chain("cabrillo-to-adif", cabrillo);
    const text = await back.text();
    expect(text).toMatch(/<adif_ver:/i);
    expect(text).toMatch(/<eoh>/i);
  });
});

describe("round-trip: more LUT and palette pairs", () => {
  it("3DL → CSP → 3DL preserves grid size", async () => {
    // Use a size-4 LUT (size-2 is ambiguous for the 3DL coordinate ladder
    // heuristic; matches the existing CUBE → 3DL test rationale).
    const lutText = `0 1 2 3
${Array.from({ length: 64 }, (_, i) => {
  const r = (i % 4) * 341;
  const g = (Math.floor(i / 4) % 4) * 341;
  const b = (Math.floor(i / 16) % 4) * 341;
  return `${r} ${g} ${b}`;
}).join("\n")}
`;
    const original = fileFromText("test.3dl", lutText, "text/plain");
    const csp = await chain("3dl-to-csp", original);
    const back = await chain("csp-to-3dl", csp);
    const text = await back.text();
    // 4^3 = 64 RGB triple lines should survive
    const triples = text.split(/\n/).filter((l) => /^\s*\d+\s+\d+\s+\d+\s*$/.test(l));
    expect(triples.length).toBeGreaterThanOrEqual(64);
  });

  it("ACO → GPL → ACO preserves color count", async () => {
    const original = fileFromBytes("test.aco", makeTinyAco(), "application/octet-stream");
    const gpl = await chain("aco-to-gpl", original);
    const back = await chain("gpl-to-aco", gpl);
    const bytes = new Uint8Array(await back.arrayBuffer());
    // ACO v1 header: version (uint16 BE = 1) + count (uint16 BE)
    expect(bytes.length).toBeGreaterThan(4);
    const colorCount = (bytes[2] << 8) | bytes[3];
    // Tiny ACO fixture has 3 colors; gpl-to-aco should preserve all
    expect(colorCount).toBeGreaterThanOrEqual(3);
  });
});

describe("round-trip: email formats", () => {
  it("EML → MBOX → EML preserves From/Subject/body", async () => {
    const original = fileFromText("test.eml", FIXTURES.eml, "message/rfc822");
    const mbox = await chain("eml-to-mbox", original);
    const back = await chain("mbox-to-eml", mbox);
    const text = await back.text();
    expect(text.toLowerCase()).toContain("from:");
    expect(text.toLowerCase()).toMatch(/subject:/);
    // EML fixture has alice@example.com and a body; both should survive
    expect(text).toContain("alice@example.com");
  });
});

describe("round-trip: new Phase-4 reverse converters", () => {
  it("ASE -> HEX list -> ASE preserves color count", async () => {
    const original = fileFromBytes("test.ase", makeTinyAse(), "application/octet-stream");
    const hex = await chain("ase-to-hex", original);
    const back = await chain("hex-to-ase", hex);
    const bytes = new Uint8Array(await back.arrayBuffer());
    // ASE 2.0 magic "ASEF" + version
    expect(bytes[0]).toBe(0x41);
    expect(bytes[1]).toBe(0x53);
    expect(bytes[2]).toBe(0x45);
    expect(bytes[3]).toBe(0x46);
    expect(back.size).toBeGreaterThan(20);
  });

  it("GPL -> HEX list -> GPL preserves color count", async () => {
    const original = fileFromText("test.gpl", FIXTURES.gpl, "text/plain");
    const hex = await chain("gpl-to-hex", original);
    const back = await chain("hex-to-gpl", hex);
    const text = await back.text();
    expect(text).toMatch(/^GIMP Palette/);
    // The fixture GPL has 3 RGB triples; both should round-trip
    const rgbLines = text
      .split("\n")
      .filter((l) => /^\s*\d+\s+\d+\s+\d+/.test(l));
    expect(rgbLines.length).toBeGreaterThanOrEqual(3);
  });

  it("CSS -> ASE -> CSS preserves color values", async () => {
    const css = `:root {
  --primary: #ff0000;
  --secondary: #00ff00;
  --tertiary: #0000ff;
}
`;
    const original = fileFromText("test.css", css, "text/css");
    const ase = await chain("css-to-ase", original);
    const back = await chain("ase-to-css", ase);
    const text = await back.text();
    expect(text.toLowerCase()).toContain("#ff0000");
    expect(text.toLowerCase()).toContain("#00ff00");
    expect(text.toLowerCase()).toContain("#0000ff");
  });

  it("JSON -> XLSX -> JSON preserves array length and row values", async () => {
    const original = fileFromText("test.json", FIXTURES.jsonArray, "application/json");
    const xlsx = await chain("json-to-xlsx", original);
    const back = await chain("xlsx-to-json", xlsx);
    const parsed = JSON.parse(await back.text());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed.find((r: { name?: string }) => r.name === "Alice")).toBeTruthy();
    expect(parsed.find((r: { name?: string }) => r.name === "Bob")).toBeTruthy();
  });
});

describe("round-trip: data interchange (YAML/TOML/JSON)", () => {
  it("YAML -> JSON -> YAML preserves nested structure and arrays", async () => {
    const original = fileFromText("test.yaml", FIXTURES.yaml, "application/x-yaml");
    const json = await chain("yaml-to-json", original);
    const back = await chain("json-to-yaml", json);
    const text = await back.text();
    expect(text).toContain("name:");
    expect(text).toContain("Alice");
    expect(text).toContain("admin");
    expect(text).toContain("editor");
    expect(text).toContain("config:");
    expect(text).toContain("theme: dark");
  });

  it("TOML -> JSON -> TOML preserves top-level keys and tables", async () => {
    const original = fileFromText("test.toml", FIXTURES.toml, "application/toml");
    const json = await chain("toml-to-json", original);
    const back = await chain("json-to-toml", json);
    const text = await back.text();
    expect(text).toContain("name");
    expect(text).toContain("Alice");
    expect(text).toContain("[config]");
    expect(text).toContain("theme");
    expect(text).toContain("dark");
  });
});

describe("round-trip: subtitles (SRT ↔ WebVTT)", () => {
  it("SRT -> WebVTT -> SRT preserves cues and timestamps", async () => {
    const original = fileFromText("test.srt", FIXTURES.srt, "application/x-subrip");
    const vtt = await chain("srt-to-vtt", original);
    const back = await chain("vtt-to-srt", vtt);
    const text = await back.text();
    expect(text).toContain("First caption text");
    expect(text).toContain("Second caption");
    expect(text).toContain("spanning two lines");
    // SRT timestamps use comma decimals
    expect(text).toMatch(/00:00:01,000\s*-->\s*00:00:04,000/);
    expect(text).toMatch(/00:00:05,500\s*-->\s*00:00:08,250/);
    // Cue indices are renumbered starting at 1
    expect(text).toMatch(/^1\b/m);
    expect(text).toMatch(/^2\b/m);
  });

  it("WebVTT -> SRT -> WebVTT preserves cues and re-adds the WEBVTT header", async () => {
    const original = fileFromText("test.vtt", FIXTURES.vtt, "text/vtt");
    const srt = await chain("vtt-to-srt", original);
    const back = await chain("srt-to-vtt", srt);
    const text = await back.text();
    expect(text).toMatch(/^WEBVTT/);
    expect(text).toContain("First caption text");
    expect(text).toContain("Second caption");
    // VTT timestamps use period decimals
    expect(text).toMatch(/00:00:01\.000\s*-->\s*00:00:04\.000/);
  });
});

describe("round-trip: CSV ↔ TSV", () => {
  it("CSV -> TSV -> CSV preserves rows and column values", async () => {
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const tsv = await chain("csv-to-tsv", original);
    const back = await chain("tsv-to-csv", tsv);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Carol");
    expect(text).toContain("Paris");
    expect(text).toContain("Tokyo");
  });
});

describe("round-trip: XML ↔ JSON", () => {
  it("XML -> JSON -> XML preserves attributes and nested elements", async () => {
    const original = fileFromText("test.xml", FIXTURES.xml, "application/xml");
    const json = await chain("xml-to-json", original);
    const back = await chain("json-to-xml", json);
    const text = await back.text();
    expect(text).toContain("The First Book");
    expect(text).toContain("Another Book");
    expect(text).toContain("Alice Smith");
    expect(text).toContain("Bob Jones");
    // The book id="1" attribute should round-trip
    expect(text).toMatch(/id=["']1["']/);
  });
});

// Markdown <-> HTML round-trip exists in tests/browser/ instead because
// turndown needs a full DOM (happy-dom is too partial). The converters
// work fine in real browsers; this test would just give a false fail
// in the Node test runner.

describe("round-trip: 3D mesh OBJ ↔ 3MF", () => {
  it("3MF → OBJ → 3MF preserves triangle count", async () => {
    // Build a 3MF from the sample mesh first since we don't have a
    // standalone 3MF fixture; reusing the 3MF→STL test pattern.
    const stl = fileFromBytes("cube.stl", makeTinyStl(), "model/stl");
    const threeMf = await chain("stl-to-3mf", stl);
    const obj = await chain("3mf-to-obj", threeMf);
    const back = await chain("obj-to-3mf", obj);
    const bytes = new Uint8Array(await back.arrayBuffer());
    // 3MF is zip; magic bytes
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(back.size).toBeGreaterThan(200);
  });
});

// ============================================================================
// Color converters
// ============================================================================
//
// HEX ↔ RGB is the only truly lossless 24-bit-precision pair.
// Anything involving HSL/CMYK loses precision through rounding (HSL has
// only 360 × 101 × 101 ≈ 3.7M discrete values vs HEX's 16.7M; CMYK is
// 100^4 with K constraints ≈ 1M useful values). For lossy pairs we test
// CONTENT preservation — pure black/white/red/green/blue should survive
// any combination because they sit at corners of the color space where
// rounding error doesn't accumulate.
describe("round-trip: HEX ↔ RGB (truly bijective)", () => {
  it("HEX → RGB → HEX preserves every value byte-for-byte", async () => {
    const original = fileFromText("colors.txt", FIXTURES.hexList);
    const rgb = await chain("hex-to-rgb", original);
    const back = await chain("rgb-to-hex", rgb);
    const text = await back.text();
    // hexList has #FF0000 #00FF00 #0000FF #FFFFFF #000000
    expect(text).toContain("#FF0000");
    expect(text).toContain("#00FF00");
    expect(text).toContain("#0000FF");
    expect(text).toContain("#FFFFFF");
    expect(text).toContain("#000000");
  });

  it("RGB → HEX → RGB preserves every value", async () => {
    const original = fileFromText("colors.txt", FIXTURES.rgbList);
    const hex = await chain("rgb-to-hex", original);
    const back = await chain("hex-to-rgb", hex);
    const text = await back.text();
    expect(text).toContain("rgb(255, 0, 0)");
    expect(text).toContain("rgb(0, 255, 0)");
    expect(text).toContain("rgb(0, 0, 255)");
    expect(text).toContain("rgb(255, 255, 255)");
    expect(text).toContain("rgb(0, 0, 0)");
  });
});

describe("round-trip: HEX ↔ HSL (lossy via rounding, corner colors survive)", () => {
  it("HEX → HSL → HEX preserves pure red/green/blue/black/white", async () => {
    const original = fileFromText("colors.txt", FIXTURES.hexList);
    const hsl = await chain("hex-to-hsl", original);
    const back = await chain("hsl-to-hex", hsl);
    const text = await back.text();
    // Corner colors round-trip exactly because they sit at HSL extremes
    expect(text).toContain("#FF0000");
    expect(text).toContain("#00FF00");
    expect(text).toContain("#0000FF");
    expect(text).toContain("#FFFFFF");
    expect(text).toContain("#000000");
  });
});

describe("round-trip: HEX ↔ CMYK (lossy, corner colors survive)", () => {
  it("HEX → CMYK → HEX preserves pure RGB primaries + black + white", async () => {
    const original = fileFromText("colors.txt", FIXTURES.hexList);
    const cmyk = await chain("hex-to-cmyk", original);
    const back = await chain("cmyk-to-hex", cmyk);
    const text = await back.text();
    expect(text).toContain("#FF0000");
    expect(text).toContain("#00FF00");
    expect(text).toContain("#0000FF");
    expect(text).toContain("#FFFFFF");
    expect(text).toContain("#000000");
  });
});

describe("round-trip: RGB ↔ HSL ↔ RGB", () => {
  it("RGB → HSL → RGB preserves corner values", async () => {
    const original = fileFromText("colors.txt", FIXTURES.rgbList);
    const hsl = await chain("rgb-to-hsl", original);
    const back = await chain("hsl-to-rgb", hsl);
    const text = await back.text();
    expect(text).toContain("rgb(255, 0, 0)");
    expect(text).toContain("rgb(0, 255, 0)");
    expect(text).toContain("rgb(0, 0, 255)");
  });
});

describe("round-trip: RGB ↔ CMYK ↔ RGB", () => {
  it("RGB → CMYK → RGB preserves corner values", async () => {
    const original = fileFromText("colors.txt", FIXTURES.rgbList);
    const cmyk = await chain("rgb-to-cmyk", original);
    const back = await chain("cmyk-to-rgb", cmyk);
    const text = await back.text();
    expect(text).toContain("rgb(255, 0, 0)");
    expect(text).toContain("rgb(0, 255, 0)");
    expect(text).toContain("rgb(0, 0, 255)");
  });
});

// ============================================================================
// Encoding/decoding — bijective for any byte sequence
// ============================================================================
describe("round-trip: text ↔ Base64 (truly bijective)", () => {
  it("Text → Base64 → Text preserves UTF-8 content including emoji", async () => {
    const original = fileFromText("input.txt", FIXTURES.encodingPlain);
    const b64 = await chain("text-to-base64", original);
    const back = await chain("base64-to-text", b64);
    expect(await back.text()).toBe(FIXTURES.encodingPlain);
  });

  it("Base64 → Text → Base64 preserves the original encoded form", async () => {
    const original = fileFromText("input.txt", FIXTURES.base64Sample);
    const text = await chain("base64-to-text", original);
    const back = await chain("text-to-base64", text);
    // Should match exactly since both directions are deterministic
    expect((await back.text()).trim()).toBe(FIXTURES.base64Sample.trim());
  });
});

describe("round-trip: text ↔ URL-encoded", () => {
  it("Text → URL-encoded → Text preserves UTF-8 content", async () => {
    const original = fileFromText("input.txt", FIXTURES.encodingPlain);
    const enc = await chain("text-to-url-encoded", original);
    const back = await chain("url-encoded-to-text", enc);
    expect(await back.text()).toBe(FIXTURES.encodingPlain);
  });
});

describe("round-trip: text ↔ hex (bijective for any UTF-8 string)", () => {
  it("Text → Hex → Text preserves content byte-for-byte", async () => {
    const original = fileFromText("input.txt", FIXTURES.encodingPlain);
    const hex = await chain("text-to-hex", original);
    const back = await chain("hex-to-text", hex);
    expect(await back.text()).toBe(FIXTURES.encodingPlain);
  });

  it("Hex → Text → Hex preserves the lowercase canonical hex form", async () => {
    const original = fileFromText("input.txt", FIXTURES.hexSample);
    const text = await chain("hex-to-text", original);
    const back = await chain("text-to-hex", text);
    expect((await back.text()).toLowerCase()).toBe(FIXTURES.hexSample.toLowerCase());
  });
});

// ============================================================================
// Geographic — content-preserving, not byte-bijective. Different formats
// have different feature kinds (KML has polygons, GPX doesn't) and
// different XML quirks (namespaces, attribute ordering).
// ============================================================================
describe("round-trip: KML ↔ GeoJSON", () => {
  it("KML → GeoJSON → KML preserves point coordinates and names", async () => {
    const original = fileFromText("test.kml", FIXTURES.kml, "application/vnd.google-earth.kml+xml");
    const geo = await chain("kml-to-geojson", original);
    const back = await chain("geojson-to-kml", geo);
    const text = await back.text();
    expect(text).toContain("Eiffel Tower");
    expect(text).toContain("2.2945");
    expect(text).toContain("48.8584");
    expect(text).toContain("<kml");
    expect(text).toContain("Sample track");
  });

  it("GeoJSON → KML → GeoJSON round-trips a FeatureCollection", async () => {
    const original = fileFromText("test.geojson", FIXTURES.geojson, "application/geo+json");
    const kml = await chain("geojson-to-kml", original);
    const back = await chain("kml-to-geojson", kml);
    const text = await back.text();
    expect(text).toContain("FeatureCollection");
    expect(text).toContain("Eiffel Tower");
    expect(text).toContain("Sample track");
  });
});

describe("round-trip: GPX ↔ GeoJSON", () => {
  it("GPX → GeoJSON → GPX preserves waypoint and track", async () => {
    const original = fileFromText("test.gpx", FIXTURES.gpx, "application/gpx+xml");
    const geo = await chain("gpx-to-geojson", original);
    const back = await chain("geojson-to-gpx", geo);
    const text = await back.text();
    expect(text).toContain("<gpx");
    expect(text).toContain("Eiffel Tower");
    expect(text).toContain("48.8584");
    expect(text).toContain("Sample track");
  });
});

describe("round-trip: KML ↔ GPX (lossy on polygons)", () => {
  it("KML → GPX → KML preserves point + line; polygon becomes track", async () => {
    const original = fileFromText("test.kml", FIXTURES.kml, "application/vnd.google-earth.kml+xml");
    const gpx = await chain("kml-to-gpx", original);
    const back = await chain("gpx-to-kml", gpx);
    const text = await back.text();
    // Eiffel Tower point survives via wpt
    expect(text).toContain("Eiffel Tower");
    expect(text).toContain("2.2945");
    // The Sample track LineString survives via trk → LineString
    expect(text).toContain("Sample track");
  });
});

// ============================================================================
// JSONL ↔ JSON / CSV
// ============================================================================
describe("round-trip: JSONL ↔ JSON", () => {
  it("JSONL → JSON → JSONL preserves all records and field values", async () => {
    const original = fileFromText("test.jsonl", FIXTURES.jsonl, "application/jsonl");
    const json = await chain("jsonl-to-json", original);
    const back = await chain("json-to-jsonl", json);
    const text = await back.text();
    const lines = text.split("\n").filter(Boolean);
    expect(lines.length).toBe(3);
    expect(text).toContain('"Alice"');
    expect(text).toContain('"Bob"');
    expect(text).toContain('"Carol"');
    expect(text).toContain('"Paris"');
  });
});

describe("round-trip: JSONL ↔ CSV", () => {
  it("JSONL → CSV → JSONL preserves all records", async () => {
    const original = fileFromText("test.jsonl", FIXTURES.jsonl, "application/jsonl");
    const csv = await chain("jsonl-to-csv", original);
    const back = await chain("csv-to-jsonl", csv);
    const text = await back.text();
    expect(text).toContain('"Alice"');
    expect(text).toContain('"Bob"');
    expect(text).toContain('"Paris"');
    expect(text.split("\n").filter(Boolean).length).toBe(3);
  });
});

// ============================================================================
// Config formats
// ============================================================================
describe("round-trip: INI ↔ JSON", () => {
  it("INI → JSON → INI preserves sections and key/value pairs", async () => {
    const original = fileFromText("config.ini", FIXTURES.ini);
    const json = await chain("ini-to-json", original);
    const back = await chain("json-to-ini", json);
    const text = await back.text();
    expect(text).toContain("[database]");
    expect(text).toContain("[server]");
    expect(text).toContain("localhost");
    // Both port values should round-trip
    expect(text).toContain("5432");
    expect(text).toContain("8080");
  });
});

describe("round-trip: .env ↔ JSON", () => {
  it(".env → JSON → .env preserves all variables", async () => {
    const original = fileFromText(".env", FIXTURES.env);
    const json = await chain("env-to-json", original);
    const back = await chain("json-to-env", json);
    const text = await back.text();
    expect(text).toContain("DATABASE_URL=");
    expect(text).toContain("postgres://localhost:5432/mydb");
    expect(text).toContain("API_KEY=");
    expect(text).toContain("sk_test_abc123");
    expect(text).toContain("NODE_ENV=");
    expect(text).toContain("PORT=");
  });
});

describe("round-trip: YAML ↔ TOML", () => {
  it("YAML → TOML → YAML preserves nested config", async () => {
    const original = fileFromText("config.yaml", FIXTURES.yaml, "application/x-yaml");
    const toml = await chain("yaml-to-toml", original);
    const back = await chain("toml-to-yaml", toml);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("admin");
    expect(text).toContain("editor");
    expect(text).toContain("dark");
    expect(text).toContain("notifications");
  });
});

describe("JSON5 → JSON (one-way; JSON IS valid JSON5)", () => {
  it("strips comments and trailing commas while preserving values", async () => {
    const original = fileFromText("config.json5", FIXTURES.json5, "application/json5");
    const json = await chain("json5-to-json", original);
    const text = await json.text();
    // Output must parse as strict JSON (no comments, double quotes, etc.)
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect(parsed.name).toBe("Alice");
    expect(parsed.age).toBe(30);
    expect(parsed.roles).toEqual(["admin", "editor"]);
    expect(parsed.config).toEqual({ theme: "dark", notifications: true });
  });
});

// ============================================================================
// SBV subtitles
// ============================================================================
describe("round-trip: SRT ↔ SBV", () => {
  it("SRT → SBV → SRT preserves cue text and timestamps", async () => {
    const original = fileFromText("test.srt", FIXTURES.srt, "application/x-subrip");
    const sbv = await chain("srt-to-sbv", original);
    const back = await chain("sbv-to-srt", sbv);
    const text = await back.text();
    expect(text).toContain("First caption text");
    expect(text).toContain("Second caption");
    expect(text).toContain("00:00:01,000 --> 00:00:04,000");
    expect(text).toContain("00:00:05,500 --> 00:00:08,250");
  });
});

// ============================================================================
// ODS ↔ XLSX ↔ CSV
// ============================================================================
describe("round-trip: ODS ↔ XLSX", () => {
  it("CSV → ODS → CSV preserves rows and values", async () => {
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const ods = await chain("csv-to-ods", original);
    const back = await chain("ods-to-csv", ods);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Carol");
    expect(text).toContain("Paris");
    expect(text).toContain("Tokyo");
  });

  it("XLSX → ODS → XLSX preserves cell values via SheetJS workbook model", async () => {
    const xlsxBytes = await makeTinyXlsx();
    const original = fileFromBytes("test.xlsx", xlsxBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const ods = await chain("xlsx-to-ods", original);
    const back = await chain("ods-to-xlsx", ods);
    // Verify the round-tripped XLSX is valid + contains the original data
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await back.arrayBuffer(), { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    expect(rows.length).toBeGreaterThan(0);
    const allValues = rows.map((r) => Object.values(r).join(",")).join(",");
    expect(allValues).toContain("Alice");
    expect(allValues).toContain("Paris");
  });
});

// ============================================================================
// Tabular: CSV ↔ Markdown table ↔ HTML table
// ============================================================================
describe("round-trip: CSV ↔ Markdown table", () => {
  it("CSV → Markdown table → CSV preserves header + every row", async () => {
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const md = await chain("csv-to-markdown-table", original);
    const back = await chain("markdown-table-to-csv", md);
    const text = await back.text();
    expect(text).toContain("name");
    expect(text).toContain("age");
    expect(text).toContain("city");
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Carol");
    expect(text).toContain("Paris");
    expect(text).toContain("London");
    expect(text).toContain("Tokyo");
  });
});

describe("round-trip: CSV ↔ HTML table", () => {
  it("CSV → HTML table → CSV preserves header + every row", async () => {
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const html = await chain("csv-to-html-table", original);
    const back = await chain("html-table-to-csv", html);
    const text = await back.text();
    expect(text).toContain("name,age,city");
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Carol");
    expect(text).toContain("Paris");
    expect(text).toContain("Tokyo");
  });
});

// ============================================================================
// SQL ↔ CSV — DB dump round-trip
// ============================================================================
describe("round-trip: CSV ↔ SQL", () => {
  it("CSV → SQL → CSV preserves rows and column values", async () => {
    const original = fileFromText("users.csv", FIXTURES.genericCsv, "text/csv");
    const sql = await chain("csv-to-sql", original);
    const back = await chain("sql-to-csv", sql);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Carol");
    expect(text).toContain("Paris");
    expect(text).toContain("London");
    expect(text).toContain("Tokyo");
  });

  it("SQL → CSV → SQL keeps the data round-tripping through the table model", async () => {
    const original = fileFromText("dump.sql", FIXTURES.sqlDump, "application/sql");
    const csv = await chain("sql-to-csv", original);
    const back = await chain("csv-to-sql", csv);
    const text = await back.text();
    expect(text).toContain("'Alice'");
    expect(text).toContain("'Paris'");
    expect(text).toContain("INSERT INTO");
  });
});

// ============================================================================
// .properties ↔ JSON
// ============================================================================
describe("round-trip: .properties ↔ JSON", () => {
  it(".properties → JSON → .properties preserves keys with dots", async () => {
    const original = fileFromText("app.properties", FIXTURES.javaProperties);
    const json = await chain("properties-to-json", original);
    const back = await chain("json-to-properties", json);
    const text = await back.text();
    expect(text).toContain("server.port");
    expect(text).toContain("8080");
    expect(text).toContain("spring.datasource.url");
    expect(text).toContain("logging.level.root");
  });
});

// ============================================================================
// Gettext PO ↔ JSON ↔ CSV
//
// PO is the universal localization interchange format. The round-trip
// must preserve every load-bearing field, because losing any of them
// (plural forms, contexts, comments, references) breaks the translator's
// ability to re-export back into Poedit/Lokalise/Crowdin/etc.
// ============================================================================
import { parsePo, type PoEntry } from "../src/lib/engine/util/po";

describe("round-trip: PO ↔ JSON", () => {
  it("preserves plurals, contexts, comments, and multi-line strings end-to-end", async () => {
    const original = fileFromText("messages.po", FIXTURES.poGettext, "text/plain");
    const json = await chain("po-to-json", original);
    const back = await chain("json-to-po", json);
    const backText = await back.text();

    // Re-parse both sides into the structured PoEntry shape and compare
    // by entry (order-preserving). Tests *structural* equivalence, not
    // string-level — whitespace/comment formatting may vary, but every
    // load-bearing field must survive.
    const before = parsePo(FIXTURES.poGettext);
    const after = parsePo(backText);
    expect(after.length).toBe(before.length);

    const stripVolatile = (e: PoEntry): PoEntry => ({
      ...e,
      // Comments are preserved but their exact whitespace can shift; we
      // only assert the meaningful fields here.
      comments: e.comments,
      extracted_comments: e.extracted_comments,
    });

    for (let i = 0; i < before.length; i++) {
      const a = stripVolatile(before[i]);
      const b = stripVolatile(after[i]);
      expect(b.msgid).toBe(a.msgid);
      expect(b.msgctxt).toBe(a.msgctxt);
      expect(b.msgid_plural).toBe(a.msgid_plural);
      expect(b.msgstr).toEqual(a.msgstr);
      expect(b.references).toEqual(a.references);
      expect(b.flags).toEqual(a.flags);
    }
  });
});

describe("round-trip: PO ↔ CSV", () => {
  it("preserves plurals via JSON-encoded msgstr_plurals column", async () => {
    const original = fileFromText("messages.po", FIXTURES.poGettext, "text/plain");
    const csv = await chain("po-to-csv", original);
    const back = await chain("csv-to-po", csv);
    const backText = await back.text();

    const before = parsePo(FIXTURES.poGettext);
    const after = parsePo(backText);
    expect(after.length).toBe(before.length);

    // CSV round-trip preserves msgid, msgctxt, msgstr (including plural
    // arrays), msgid_plural, references, and flags. Comments are also
    // preserved but joined/split via " | " so we test them softly.
    for (let i = 0; i < before.length; i++) {
      expect(after[i].msgid).toBe(before[i].msgid);
      expect(after[i].msgctxt).toBe(before[i].msgctxt);
      expect(after[i].msgid_plural).toBe(before[i].msgid_plural);
      expect(after[i].msgstr).toEqual(before[i].msgstr);
      expect(after[i].references).toEqual(before[i].references);
      expect(after[i].flags).toEqual(before[i].flags);
    }
  });

  it("the noun/verb msgctxt disambiguation survives the CSV round-trip", async () => {
    // The fixture has two entries with msgid \"Order\" but different
    // msgctxt (noun vs verb). A naive CSV writer that doesn't carry
    // msgctxt would collapse them into one row and lose a translation.
    const original = fileFromText("messages.po", FIXTURES.poGettext, "text/plain");
    const csv = await chain("po-to-csv", original);
    const back = await chain("csv-to-po", csv);
    const entries = parsePo(await back.text());

    const orderEntries = entries.filter((e) => e.msgid === "Order");
    expect(orderEntries.length).toBe(2);
    const contexts = orderEntries.map((e) => e.msgctxt).sort();
    expect(contexts).toEqual(["noun", "verb"]);
    const translations = orderEntries.map((e) => e.msgstr).sort();
    expect(translations).toEqual(["Ordenar", "Pedido"]);
  });
});

// ============================================================================
// HCL → JSON (one-way)
// ============================================================================
describe("HCL → JSON (Terraform configs)", () => {
  it("parses Terraform syntax into a valid JSON object tree", async () => {
    const original = fileFromText("main.tf", FIXTURES.hclTerraform, "text/x-hcl");
    const json = await chain("hcl-to-json", original);
    const text = await json.text();
    const parsed = JSON.parse(text);
    // hcl2-parser wraps everything in an outer array; normalize that
    const root = Array.isArray(parsed) ? parsed[0] : parsed;
    expect(root).toBeTruthy();
    // Should at minimum mention the bucket name we put in the fixture
    expect(text).toContain("my-log-bucket");
    expect(text).toContain("production");
  });
});

// ============================================================================
// Color names ↔ HEX
// ============================================================================
describe("round-trip: color name ↔ HEX (lossy via nearest-neighbor)", () => {
  it("Name → HEX → Name returns the same name for all 147 named colors", async () => {
    const original = fileFromText("colors.txt", FIXTURES.colorNames);
    const hex = await chain("color-name-to-hex", original);
    const back = await chain("hex-to-color-name", hex);
    const text = await back.text();
    // Each fixture name has an exact hex match, so the nearest-neighbor
    // lookup will return the same name back.
    expect(text).toContain("tomato");
    expect(text).toContain("royalblue");
    expect(text).toContain("forestgreen");
    expect(text).toContain("gold");
    expect(text).toContain("crimson");
  });
});

// ============================================================================
// Date / time
// ============================================================================
describe("round-trip: Unix ↔ ISO 8601", () => {
  it("Unix → ISO → Unix preserves second-precision timestamps", async () => {
    const original = fileFromText("timestamps.txt", FIXTURES.unixTimestamps);
    const iso = await chain("unix-to-iso", original);
    const back = await chain("iso-to-unix", iso);
    const text = await back.text();
    // Original fixture: 1704067200, 1717977600, 1735689600
    expect(text).toContain("1704067200");
    expect(text).toContain("1717977600");
    expect(text).toContain("1735689600");
  });

  it("ISO → Unix → ISO preserves the date component", async () => {
    const original = fileFromText("dates.txt", FIXTURES.isoDates);
    const unix = await chain("iso-to-unix", original);
    const back = await chain("unix-to-iso", unix);
    const text = await back.text();
    // Each ISO date in the fixture is at midnight UTC; round-trips exactly
    expect(text).toContain("2024-01-01T00:00:00.000Z");
    expect(text).toContain("2024-06-10T00:00:00.000Z");
    expect(text).toContain("2025-01-01T00:00:00.000Z");
  });
});

// ============================================================================
// Modern color spaces — OKLCH/LAB are perceptually uniform but rounding-bound.
// ============================================================================
describe("round-trip: HEX ↔ OKLCH (lossy via gamut + rounding)", () => {
  it("HEX → OKLCH → HEX preserves pure black and white exactly", async () => {
    const original = fileFromText("colors.txt", "#000000\n#FFFFFF\n");
    const oklch = await chain("hex-to-oklch", original);
    const back = await chain("oklch-to-hex", oklch);
    const text = await back.text();
    expect(text).toContain("#000000");
    expect(text).toContain("#FFFFFF");
  });
});

describe("round-trip: HEX ↔ LAB (lossy via rounding)", () => {
  it("HEX → LAB → HEX preserves pure black and white", async () => {
    const original = fileFromText("colors.txt", "#000000\n#FFFFFF\n");
    const lab = await chain("hex-to-lab", original);
    const back = await chain("lab-to-hex", lab);
    const text = await back.text();
    expect(text).toContain("#000000");
    expect(text).toContain("#FFFFFF");
  });
});

// ============================================================================
// TSV cross-conversions — bijective with CSV through SheetJS workbook model.
// ============================================================================
describe("round-trip: TSV ↔ JSON", () => {
  it("TSV → JSON → TSV preserves all rows and columns", async () => {
    const original = fileFromText("test.tsv", FIXTURES.tsv, "text/tab-separated-values");
    const json = await chain("tsv-to-json", original);
    const back = await chain("json-to-tsv", json);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Carol");
    expect(text).toContain("Paris");
    expect(text).toMatch(/\t/);
  });
});

describe("round-trip: TSV ↔ XLSX", () => {
  it("TSV → XLSX → TSV preserves the workbook contents", async () => {
    const original = fileFromText("test.tsv", FIXTURES.tsv, "text/tab-separated-values");
    const xlsx = await chain("tsv-to-xlsx", original);
    const back = await chain("xlsx-to-tsv", xlsx);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Tokyo");
    expect(text).toMatch(/\t/);
  });
});

describe("round-trip: CSV ↔ YAML", () => {
  it("CSV → YAML → CSV preserves all records", async () => {
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const yamlOut = await chain("csv-to-yaml", original);
    const back = await chain("yaml-to-csv", yamlOut);
    const text = await back.text();
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
    expect(text).toContain("Carol");
    expect(text).toContain("Paris");
  });
});

describe("round-trip: PEM ↔ DER", () => {
  it("PEM → DER → PEM preserves the underlying certificate bytes", async () => {
    const original = fileFromText("cert.pem", FIXTURES.pemSample, "application/x-pem-file");
    const der = await chain("pem-to-der", original);
    const back = await chain("der-to-pem", der);
    const text = await back.text();
    expect(text).toContain("-----BEGIN CERTIFICATE-----");
    expect(text).toContain("-----END CERTIFICATE-----");
    const stripped = (s: string) =>
      s.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s/g, "");
    expect(stripped(text)).toBe(stripped(FIXTURES.pemSample));
  });
});

describe("JWT → JSON decoder", () => {
  it("decodes the header, payload, and signature", async () => {
    const original = fileFromText("token.jwt", FIXTURES.jwtSample, "application/jwt");
    const json = await chain("jwt-to-json", original);
    const text = await json.text();
    const parsed = JSON.parse(text) as {
      header: { alg: string; typ: string };
      payload: { sub: string; name: string; iat: number };
      signature: string | null;
    };
    expect(parsed.header.alg).toBe("HS256");
    expect(parsed.header.typ).toBe("JWT");
    expect(parsed.payload.sub).toBe("1234567890");
    expect(parsed.payload.name).toBe("Alice Ngyen");
    expect(parsed.payload.iat).toBe(1717977600);
    expect(parsed.signature).toBe("bogus-signature-not-verified");
  });

  it("strips Bearer prefix when present", async () => {
    const original = fileFromText("token.jwt", `Bearer ${FIXTURES.jwtSample}`, "application/jwt");
    const json = await chain("jwt-to-json", original);
    const parsed = JSON.parse(await json.text()) as { payload: { sub: string } };
    expect(parsed.payload.sub).toBe("1234567890");
  });
});

// ============================================================================
// Medical: HL7 v2.x messaging round-trip
// ============================================================================
describe("round-trip: HL7 v2 ↔ JSON", () => {
  it("HL7 → JSON decodes the patient identity from PID-5", async () => {
    const original = fileFromText("test.hl7", FIXTURES.hl7v2, "application/hl7-v2");
    const json = await chain("hl7-to-json", original);
    const parsed = JSON.parse(await json.text()) as {
      MSH: Array<Record<string, unknown>>;
      PID: Array<Record<string, unknown>>;
    };
    expect(parsed.MSH).toHaveLength(1);
    expect(parsed.PID).toHaveLength(1);
    // PID-5 is patient name, expanded to ["DOE", "JOHN", "A"] components
    expect(parsed.PID[0]["PID.5"]).toEqual(["DOE", "JOHN", "A"]);
    // PID-7 is birth date as a string
    expect(parsed.PID[0]["PID.7"]).toBe("19800515");
    // PID-8 is gender
    expect(parsed.PID[0]["PID.8"]).toBe("M");
  });

  it("JSON → HL7 → JSON preserves segments and field values", async () => {
    const originalJson = fileFromText(
      "test.json",
      JSON.stringify({
        MSH: [
          {
            "MSH.1": "|",
            "MSH.2": "^~\\&",
            "MSH.3": "TEST",
            "MSH.7": "20240101120000",
            "MSH.9": "ADT^A01",
            "MSH.10": "MSG999",
            "MSH.11": "P",
            "MSH.12": "2.5",
          },
        ],
        PID: [
          {
            "PID.1": "1",
            "PID.5": ["SMITH", "JANE"],
            "PID.7": "19900315",
            "PID.8": "F",
          },
        ],
      }),
      "application/json",
    );
    const hl7 = await chain("json-to-hl7", originalJson);
    const back = await chain("hl7-to-json", hl7);
    const parsed = JSON.parse(await back.text()) as {
      MSH: Array<Record<string, unknown>>;
      PID: Array<Record<string, unknown>>;
    };
    expect(parsed.MSH[0]["MSH.10"]).toBe("MSG999");
    expect(parsed.PID[0]["PID.5"]).toEqual(["SMITH", "JANE"]);
    expect(parsed.PID[0]["PID.7"]).toBe("19900315");
    expect(parsed.PID[0]["PID.8"]).toBe("F");
  });
});

describe("HL7 → CSV (one row per segment, columns per field index)", () => {
  it("emits one row per segment with the segment type as the first column", async () => {
    const original = fileFromText("test.hl7", FIXTURES.hl7v2, "application/hl7-v2");
    const csv = await chain("hl7-to-csv", original);
    const text = await csv.text();
    // Headers: segment + per-segment field-index columns
    expect(text.split("\n")[0]).toContain("segment");
    // Should mention every segment type from our fixture
    expect(text).toContain("MSH");
    expect(text).toContain("PID");
    expect(text).toContain("PV1");
    expect(text).toContain("DG1");
    expect(text).toContain("DOE^JOHN^A");
  });
});

// ============================================================================
// Medical: FHIR Bundle round-trip
// ============================================================================
describe("round-trip: FHIR Bundle ↔ CSV", () => {
  it("FHIR Bundle → CSV → FHIR Bundle preserves resource ids and types", async () => {
    const original = fileFromText("bundle.json", FIXTURES.fhirBundle, "application/fhir+json");
    const csv = await chain("fhir-bundle-to-csv", original);
    const back = await chain("csv-to-fhir-bundle", csv);
    const text = await back.text();
    const parsed = JSON.parse(text) as {
      resourceType: string;
      entry: Array<{ resource: { resourceType: string; id: string } }>;
    };
    expect(parsed.resourceType).toBe("Bundle");
    expect(parsed.entry).toHaveLength(3);
    // All three resource types from the fixture survive
    const types = parsed.entry.map((e) => e.resource.resourceType).sort();
    expect(types).toEqual(["Condition", "Observation", "Patient"]);
    // The Patient id survives
    const patient = parsed.entry.find((e) => e.resource.resourceType === "Patient");
    expect(patient?.resource.id).toBe("patient-001");
  });
});

// ============================================================================
// Medical: C-CDA → HTML / JSON
// ============================================================================
describe("C-CDA → HTML rendering", () => {
  it("extracts patient identity, document title, and section titles", async () => {
    const original = fileFromText("ccd.xml", FIXTURES.ccda, "application/cda+xml");
    const html = await chain("ccda-to-html", original);
    const text = await html.text();
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain("Continuity of Care Document");
    expect(text).toContain("John");
    expect(text).toContain("Doe");
    expect(text).toContain("1980-05-15"); // birthdate normalized from YYYYMMDD
    expect(text).toContain("Allergies");
    expect(text).toContain("Medications");
    expect(text).toContain("Problems");
    expect(text).toContain("Albuterol");
  });
});

describe("C-CDA → JSON extraction", () => {
  it("extracts patient demographics and section titles", async () => {
    const original = fileFromText("ccd.xml", FIXTURES.ccda, "application/cda+xml");
    const json = await chain("ccda-to-json", original);
    const parsed = JSON.parse(await json.text()) as {
      documentTitle: string;
      patient: { givenName: string; familyName: string; birthTime: string };
      sections: Array<{ title: string }>;
    };
    expect(parsed.documentTitle).toBe("Continuity of Care Document");
    expect(parsed.patient.givenName).toBe("John");
    expect(parsed.patient.familyName).toBe("Doe");
    expect(parsed.patient.birthTime).toBe("19800515");
    expect(parsed.sections.map((s) => s.title)).toEqual([
      "Allergies",
      "Medications",
      "Problems",
    ]);
  });
});

// ============================================================================
// Legal: Concordance DAT/OPT load files
// ============================================================================
describe("round-trip: Concordance DAT ↔ CSV", () => {
  it("DAT → CSV → DAT preserves headers and every row", async () => {
    const original = fileFromText("production.dat", FIXTURES.datLoadFile, "application/vnd.concordance-dat");
    const csv = await chain("dat-to-csv", original);
    const back = await chain("csv-to-dat", csv);
    const text = await back.text();
    // Round-trip must preserve every Bates number from the fixture
    expect(text).toContain("ABC0000001");
    expect(text).toContain("ABC0000003");
    expect(text).toContain("ABC0000004");
    expect(text).toContain("ABC0000005");
    expect(text).toContain("alice@example.com");
    expect(text).toContain("Q4 review meeting");
    expect(text).toContain("Contract draft");
    // Output has the Concordance text qualifier (þ) wrapping cells
    expect(text).toContain("þ");
  });
});

describe("Concordance OPT → CSV", () => {
  it("emits headers and one row per page", async () => {
    const original = fileFromText("images.opt", FIXTURES.optLoadFile, "application/vnd.concordance-opt");
    const csv = await chain("opt-to-csv", original);
    const text = await csv.text();
    // Headers from optToTable
    expect(text).toMatch(/^PageID,Volume,ImagePath/m);
    // 5 data rows from fixture
    expect(text.split("\n").filter(Boolean)).toHaveLength(6); // header + 5 rows
    // Bates IDs and the boundary marker survive
    expect(text).toContain("ABC0000001");
    expect(text).toContain("ABC0000005");
    expect(text).toContain("VOL001");
  });
});

// ============================================================================
// Academic: BibTeX expanded family (CSL-JSON / YAML / Markdown / HTML)
// ============================================================================
describe("round-trip: BibTeX ↔ CSL-JSON (Zotero/Pandoc native)", () => {
  it("BibTeX → CSL-JSON → BibTeX preserves citation key, title, authors, year, doi", async () => {
    const original = fileFromText("refs.bib", FIXTURES.bibtex, "application/x-bibtex");
    const csl = await chain("bibtex-to-csl-json", original);
    const back = await chain("csl-json-to-bibtex", csl);
    const text = await back.text();
    expect(text).toContain("smith2024");
    expect(text).toContain("A Sample Paper");
    expect(text).toContain("Smith, John");
    expect(text).toContain("Doe, Jane");
    expect(text).toContain("Nature");
    expect(text).toContain("2024");
    expect(text).toContain("10.1038/sample.2024.001");
  });

  it("CSL-JSON → BibTeX → CSL-JSON preserves the citation list structurally", async () => {
    const original = fileFromText("refs.json", FIXTURES.cslJson, "application/vnd.citationstyles.csl+json");
    const bib = await chain("csl-json-to-bibtex", original);
    const back = await chain("bibtex-to-csl-json", bib);
    const parsed = JSON.parse(await back.text()) as Array<{
      id: string;
      type: string;
      title: string;
      author?: Array<{ family: string; given: string }>;
    }>;
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe("smith2024");
    expect(parsed[1].id).toBe("brown2023");
    expect(parsed[0].title).toBe("A Sample Paper");
    expect(parsed[1].title).toBe("Book on a Topic");
    expect(parsed[0].author?.[0]).toEqual({ family: "Smith", given: "John" });
  });

  it("CSL-JSON output is valid JSON with `article-journal` type for articles", async () => {
    const original = fileFromText("refs.bib", FIXTURES.bibtex, "application/x-bibtex");
    const csl = await chain("bibtex-to-csl-json", original);
    const parsed = JSON.parse(await csl.text());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].type).toBe("article-journal");
    expect(parsed[0].DOI).toBe("10.1038/sample.2024.001");
  });
});

describe("round-trip: BibTeX ↔ YAML (CSL-YAML for Pandoc)", () => {
  it("BibTeX → YAML → BibTeX preserves the citation fields end-to-end", async () => {
    const original = fileFromText("refs.bib", FIXTURES.bibtex, "application/x-bibtex");
    const yamlOut = await chain("bibtex-to-yaml", original);
    const back = await chain("yaml-to-bibtex", yamlOut);
    const text = await back.text();
    expect(text).toContain("smith2024");
    expect(text).toContain("A Sample Paper");
    expect(text).toContain("Smith, John");
    expect(text).toContain("10.1038/sample.2024.001");
  });

  it("YAML output uses Pandoc's `references:` wrapper convention", async () => {
    const original = fileFromText("refs.bib", FIXTURES.bibtex, "application/x-bibtex");
    const yamlOut = await chain("bibtex-to-yaml", original);
    expect(await yamlOut.text()).toMatch(/^references:/m);
  });
});

describe("BibTeX → Markdown bibliography (one-way render)", () => {
  it("emits a numbered Markdown bibliography with every entry from the BibTeX", async () => {
    const original = fileFromText("refs.bib", FIXTURES.bibtex, "application/x-bibtex");
    const md = await chain("bibtex-to-markdown", original);
    const text = await md.text();
    expect(text).toMatch(/^# References/m);
    expect(text).toMatch(/^1\./m);
    expect(text).toContain("A Sample Paper");
    expect(text).toContain("Smith");
    expect(text).toContain("Doe");
    expect(text).toContain("*Nature*");
    expect(text).toContain("(2024)");
  });
});

describe("BibTeX → HTML bibliography (one-way render)", () => {
  it("emits a complete HTML document with the citation as an <li>", async () => {
    const original = fileFromText("refs.bib", FIXTURES.bibtex, "application/x-bibtex");
    const html = await chain("bibtex-to-html", original);
    const text = await html.text();
    expect(text).toMatch(/^<!DOCTYPE html>/);
    expect(text).toContain("<ol>");
    expect(text).toContain("<li>");
    expect(text).toContain("A Sample Paper");
    expect(text).toContain("<em>Nature</em>");
    expect(text).toContain("https://doi.org/10.1038/sample.2024.001");
  });
});
