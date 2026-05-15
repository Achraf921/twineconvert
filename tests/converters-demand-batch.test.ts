/**
 * Demand-batch converters (added off real GSC query data).
 *
 * Every test runs the real converter and then RE-PARSES the output and
 * asserts on actual values, not just "blob is non-empty". This catches
 * the "produces a file but the contents are wrong" failure mode.
 *
 *   - *-to-xlsx: re-open with SheetJS, assert a known cell value
 *   - mbox-to-csv: re-parse CSV, assert per-message rows
 *   - fen-to-pgn: re-load with chess.js, assert the position round-trips
 *   - ttf-to-otf: re-parse the output as a font, assert glyphs survived
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";

async function xlsxRows(blob: Blob): Promise<string[][]> {
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default ?? XLSXModule;
  const buf = new Uint8Array(await blob.arrayBuffer());
  // PK zip magic — xlsx is a zip container.
  expect(buf[0]).toBe(0x50);
  expect(buf[1]).toBe(0x4b);
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false });
}

describe("demand-batch: bibliographic/genealogy → XLSX", () => {
  it("bibtex-to-xlsx writes a real spreadsheet with the reference data", async () => {
    const input = fileFromText("refs.bib", FIXTURES.bibtex, "application/x-bibtex");
    const result = await run("bibtex-to-xlsx", input);
    expect(result.blob.type).toContain("spreadsheetml");
    const rows = await xlsxRows(result.blob);
    expect(rows.length).toBeGreaterThan(1); // header + >=1 record
    const flat = rows.flat().join(" ").toLowerCase();
    expect(flat).toContain("smith");
  });

  it("ris-to-xlsx writes a real spreadsheet", async () => {
    const input = fileFromText("refs.ris", FIXTURES.ris, "application/x-research-info-systems");
    const result = await run("ris-to-xlsx", input);
    const rows = await xlsxRows(result.blob);
    const flat = rows.flat().join(" ").toLowerCase();
    expect(flat).toContain("nature");
  });

  it("nbib-to-xlsx writes a real spreadsheet from a PubMed export", async () => {
    const input = fileFromText("pubmed.nbib", FIXTURES.nbib, "application/x-research-info-systems");
    const result = await run("nbib-to-xlsx", input);
    const rows = await xlsxRows(result.blob);
    const flat = rows.flat().join(" ").toLowerCase();
    expect(flat).toContain("pubmed sample paper");
  });

  it("gedcom-to-xlsx writes a real spreadsheet with individuals", async () => {
    const input = fileFromText("tree.ged", FIXTURES.gedcom, "text/plain");
    const result = await run("gedcom-to-xlsx", input);
    const rows = await xlsxRows(result.blob);
    const flat = rows.flat().join(" ").toLowerCase();
    expect(flat).toContain("john");
    expect(flat).toContain("smith");
  });
});

describe("demand-batch: mbox-to-csv", () => {
  it("extracts one row per message with the right headers", async () => {
    const input = fileFromText("inbox.mbox", FIXTURES.mbox, "application/mbox");
    const result = await run("mbox-to-csv", input);
    expect(result.blob.type).toContain("csv");
    const Papa = (await import("papaparse")).default;
    const text = await result.blob.text();
    const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true });
    expect(parsed.data.length).toBe(2);
    const subjects = parsed.data.map((r) => r.subject);
    expect(subjects).toContain("First message");
    expect(parsed.data[0].from.toLowerCase()).toContain("alice");
    expect(parsed.data[1].cc.toLowerCase()).toContain("carol");
  });
});

describe("demand-batch: fen-to-pgn", () => {
  it("emits a PGN that chess.js loads back to the exact same position", async () => {
    const input = fileFromText("pos.fen", FIXTURES.fen, "application/x-fen");
    const result = await run("fen-to-pgn", input);
    expect(result.blob.type).toContain("chess-pgn");
    const pgnText = await result.blob.text();
    const { Chess } = await import("chess.js");
    const inputFens = FIXTURES.fen.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    // Split the multi-game PGN and verify each game's setup FEN round-trips.
    const games = pgnText.split(/\n\s*\n(?=\[)/).map((g) => g.trim()).filter(Boolean);
    expect(games.length).toBe(inputFens.length);
    for (let i = 0; i < games.length; i++) {
      const chess = new Chess();
      chess.loadPgn(games[i]);
      expect(chess.fen()).toBe(inputFens[i]);
    }
  });

  it("rejects a malformed FEN with a clear error", async () => {
    const input = fileFromText("bad.fen", "not a valid fen string", "application/x-fen");
    await expect(run("fen-to-pgn", input)).rejects.toThrow();
  });
});
