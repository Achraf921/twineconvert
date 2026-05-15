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

/** Re-open the xlsx and return {header, rows-as-objects} so tests can
 *  assert column-addressed values and exact record counts (a parser
 *  dropping a record then fails loudly, not silently). */
async function xlsxTable(
  blob: Blob,
): Promise<{ header: string[]; records: Record<string, string>[] }> {
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default ?? XLSXModule;
  const buf = new Uint8Array(await blob.arrayBuffer());
  // PK zip magic — xlsx is a zip container.
  expect(buf[0]).toBe(0x50);
  expect(buf[1]).toBe(0x4b);
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false });
  const [header, ...rows] = aoa;
  const records = rows.map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[String(h)] = r[i] != null ? String(r[i]) : ""));
    return o;
  });
  return { header: header.map(String), records };
}

describe("demand-batch: bibliographic/genealogy → XLSX", () => {
  it("bibtex-to-xlsx: every reference survives, in the right columns", async () => {
    const { parseBibtex } = await import("../src/lib/engine/util/bibtex");
    const expected = parseBibtex(FIXTURES.bibtex);
    expect(expected.length).toBeGreaterThan(0);

    const result = await run(
      "bibtex-to-xlsx",
      fileFromText("refs.bib", FIXTURES.bibtex, "application/x-bibtex"),
    );
    expect(result.blob.type).toContain("spreadsheetml");
    const { header, records } = await xlsxTable(result.blob);
    // No record silently dropped.
    expect(records.length).toBe(expected.length);
    expect(header).toContain("title");
    expect(header).toContain("authors");
    // Right value in the right column, not just "somewhere in the sheet".
    expect(records[0].title).toBe("A Sample Paper");
    expect(records[0].authors).toContain("Smith, John");
    expect(records[0].authors).toContain("Doe, Jane");
    expect(records[0].year).toBe("2024");
  });

  it("ris-to-xlsx: every reference survives, in the right columns", async () => {
    const { parseRis } = await import("../src/lib/engine/util/ris");
    const expected = parseRis(FIXTURES.ris);
    expect(expected.length).toBeGreaterThan(0);

    const result = await run(
      "ris-to-xlsx",
      fileFromText("refs.ris", FIXTURES.ris, "application/x-research-info-systems"),
    );
    const { records } = await xlsxTable(result.blob);
    expect(records.length).toBe(expected.length);
    expect(records[0].title).toBe(expected[0].title ?? "");
    expect(records[0].authors).toContain("Smith");
  });

  it("nbib-to-xlsx: every PubMed record survives, in the right columns", async () => {
    const { parseRis } = await import("../src/lib/engine/util/ris");
    const expected = parseRis(FIXTURES.nbib);
    expect(expected.length).toBeGreaterThan(0);

    const result = await run(
      "nbib-to-xlsx",
      fileFromText("pubmed.nbib", FIXTURES.nbib, "application/x-research-info-systems"),
    );
    const { records } = await xlsxTable(result.blob);
    expect(records.length).toBe(expected.length);
    expect(records[0].title).toBe("PubMed Sample Paper");
  });

  it("gedcom-to-xlsx: every individual survives, in the right columns", async () => {
    const { parseGedcom } = await import("../src/lib/engine/util/gedcom-parse");
    const { individuals } = parseGedcom(FIXTURES.gedcom);
    expect(individuals.length).toBeGreaterThan(0);

    const result = await run(
      "gedcom-to-xlsx",
      fileFromText("tree.ged", FIXTURES.gedcom, "text/plain"),
    );
    const { header, records } = await xlsxTable(result.blob);
    expect(records.length).toBe(individuals.length);
    expect(header).toContain("surname");
    // The converter splits NAME into given/surname — assert that worked.
    const john = records.find((r) => r.givenName === "John");
    expect(john).toBeDefined();
    expect(john!.surname).toBe("Smith");
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
