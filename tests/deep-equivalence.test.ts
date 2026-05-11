/**
 * Deep round-trip equivalence tests.
 *
 * The existing `round-trip.test.ts` uses `expect(text).toContain("Alice")`-
 * style substring checks. Those catch obvious breakage but pass falsely
 * when the round-trip:
 *   - drops or duplicates rows (count drift)
 *   - reorders rows or columns
 *   - silently coerces types (number → string, etc.)
 *   - corrupts only the row that doesn't contain "Alice"
 *
 * This file does the opposite: it parses the round-tripped output back
 * into a structured representation and asserts STRUCTURAL EQUALITY with
 * the input. If the round-trip preserved one row but dropped another,
 * `toEqual` catches it. If it preserved values but reordered columns,
 * `toEqual` catches it. If it converted "30" → 30 silently, `toEqual`
 * catches it.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText, FIXTURES } from "./fixtures/text-fixtures";
import { parseSubtitle } from "../src/lib/engine/util/subtitle";
import { parseJsonl } from "../src/lib/engine/util/jsonl";
import {
  parseHexLines,
  parseRgbLines,
  hexToRgb,
  rgbToHex,
} from "../src/lib/engine/util/color-math";
import { parseMarkdownTable, parseHtmlTable } from "../src/lib/engine/util/tables";
import { parseSqlDump } from "../src/lib/engine/util/sql";

async function chain(toolId: string, input: File): Promise<File> {
  const result = await run(toolId, input);
  return new File([await result.blob.arrayBuffer()], result.filename, {
    type: result.blob.type,
  });
}

// Papa is dynamically imported per test (consistent with the converters);
// the inline import-namespace type avoids having to copy papaparse types.
const parseCsv = (
  papa: { parse: typeof import("papaparse")["parse"] },
  text: string,
) =>
  papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // keep strings as strings so equality is type-safe
  });

// ============================================================================
// Encoding — truly bijective; round-trip MUST be byte-for-byte identical.
// ============================================================================
describe("deep: text ↔ Base64 byte-for-byte identity", () => {
  const inputs = [
    "",
    "Hello",
    "Café 🎵 ÿ",
    "spaces  with  padding",
    "JSON-{like}-content with [brackets] and \"quotes\"",
    "x".repeat(10_000),
  ];

  it.each(inputs)("text → b64 → text returns %j unchanged", async (input) => {
    const f = fileFromText("input.txt", input);
    const b64 = await chain("text-to-base64", f);
    const back = await chain("base64-to-text", b64);
    expect(await back.text()).toBe(input);
  });
});

describe("deep: text ↔ hex byte-for-byte identity", () => {
  const inputs = ["Hello", "Café 🎵", "newline\nhere", " "];

  it.each(inputs)("text → hex → text returns %j unchanged", async (input) => {
    const f = fileFromText("input.txt", input);
    const hex = await chain("text-to-hex", f);
    const back = await chain("hex-to-text", hex);
    expect(await back.text()).toBe(input);
  });
});

describe("deep: text ↔ URL-encoded byte-for-byte identity", () => {
  const inputs = ["Hello, world!", "Café 🎵", "key=value&x=1"];

  it.each(inputs)("text → urlenc → text returns %j unchanged", async (input) => {
    const f = fileFromText("input.txt", input);
    const enc = await chain("text-to-url-encoded", f);
    const back = await chain("url-encoded-to-text", enc);
    expect(await back.text()).toBe(input);
  });
});

// ============================================================================
// HEX ↔ RGB — bijective at 8-bit precision; structural equality after parse.
// ============================================================================
describe("deep: HEX ↔ RGB structural equality (parse both sides)", () => {
  it("round-trip preserves order, count, and exact value of every color", async () => {
    const original = fileFromText("colors.txt", FIXTURES.hexList);
    const rgb = await chain("hex-to-rgb", original);
    const back = await chain("rgb-to-hex", rgb);

    const originalHexes = parseHexLines(FIXTURES.hexList);
    const backHexes = parseHexLines(await back.text());

    // Same count → no rows dropped or duplicated
    expect(backHexes).toHaveLength(originalHexes.length);
    // Same order → not just same set
    expect(backHexes).toEqual(originalHexes);
  });

  it("rgb-to-hex output parses to the same RGB tuples as the input", async () => {
    const original = fileFromText("colors.txt", FIXTURES.rgbList);
    const hex = await chain("rgb-to-hex", original);
    const back = await chain("hex-to-rgb", hex);

    const originalRgbs = parseRgbLines(FIXTURES.rgbList);
    const backRgbs = parseRgbLines(await back.text());

    expect(backRgbs).toHaveLength(originalRgbs.length);
    expect(backRgbs).toEqual(originalRgbs);
  });

  it("intermediate hex output matches what hexToRgb/rgbToHex produces directly", async () => {
    // If our pure utils say HEX(#FF6347) ↔ RGB(255,99,71), the converter
    // chain MUST produce the same intermediate. This catches drift between
    // the converter and the util it's supposed to wrap.
    const original = fileFromText("colors.txt", "#FF6347\n");
    const rgbResult = await run("hex-to-rgb", original);
    const expected = `rgb(${hexToRgb("#FF6347").r}, ${hexToRgb("#FF6347").g}, ${hexToRgb("#FF6347").b})`;
    expect((await rgbResult.blob.text()).trim()).toBe(expected);

    const rgbInput = fileFromText("colors.txt", "rgb(255, 99, 71)\n");
    const hexResult = await run("rgb-to-hex", rgbInput);
    expect((await hexResult.blob.text()).trim()).toBe(rgbToHex({ r: 255, g: 99, b: 71 }));
  });
});

// ============================================================================
// Subtitles — cue-by-cue structural equality across SRT/VTT/SBV.
// ============================================================================
describe("deep: subtitle round-trip preserves cue list exactly", () => {
  it("SRT → VTT → SRT preserves every cue's start/end/text", async () => {
    const original = fileFromText("test.srt", FIXTURES.srt, "application/x-subrip");
    const vtt = await chain("srt-to-vtt", original);
    const back = await chain("vtt-to-srt", vtt);

    const originalCues = parseSubtitle(FIXTURES.srt);
    const backCues = parseSubtitle(await back.text());

    expect(backCues).toHaveLength(originalCues.length);
    for (let i = 0; i < originalCues.length; i++) {
      expect(backCues[i].startMs).toBe(originalCues[i].startMs);
      expect(backCues[i].endMs).toBe(originalCues[i].endMs);
      expect(backCues[i].text).toBe(originalCues[i].text);
    }
  });

  it("SRT → SBV → SRT preserves every cue's start/end/text", async () => {
    const original = fileFromText("test.srt", FIXTURES.srt, "application/x-subrip");
    const sbv = await chain("srt-to-sbv", original);
    const back = await chain("sbv-to-srt", sbv);

    const originalCues = parseSubtitle(FIXTURES.srt);
    const backCues = parseSubtitle(await back.text());

    expect(backCues).toHaveLength(originalCues.length);
    expect(backCues.map((c) => ({ startMs: c.startMs, endMs: c.endMs, text: c.text })))
      .toEqual(
        originalCues.map((c) => ({ startMs: c.startMs, endMs: c.endMs, text: c.text })),
      );
  });
});

// ============================================================================
// Tabular: CSV ↔ TSV ↔ JSON ↔ JSONL ↔ Markdown ↔ HTML — same logical table.
// ============================================================================
describe("deep: tabular round-trips preserve row count and value identity", () => {
  it("CSV → TSV → CSV preserves the full table with row+column equality", async () => {
    const Papa = (await import("papaparse")).default;
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const tsv = await chain("csv-to-tsv", original);
    const back = await chain("tsv-to-csv", tsv);

    const originalParsed = await parseCsv(Papa, FIXTURES.genericCsv);
    const backParsed = await parseCsv(Papa, await back.text());

    expect(backParsed.data).toEqual(originalParsed.data);
    expect(backParsed.meta.fields).toEqual(originalParsed.meta.fields);
  });

  it("CSV → Markdown table → CSV preserves headers + every row exactly", async () => {
    const Papa = (await import("papaparse")).default;
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const md = await chain("csv-to-markdown-table", original);
    const back = await chain("markdown-table-to-csv", md);

    const originalParsed = await parseCsv(Papa, FIXTURES.genericCsv);
    const backParsed = await parseCsv(Papa, await back.text());

    expect(backParsed.meta.fields).toEqual(originalParsed.meta.fields);
    expect(backParsed.data).toEqual(originalParsed.data);
  });

  it("CSV → HTML table → CSV preserves headers + every row exactly", async () => {
    const Papa = (await import("papaparse")).default;
    const original = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const html = await chain("csv-to-html-table", original);
    const back = await chain("html-table-to-csv", html);

    const originalParsed = await parseCsv(Papa, FIXTURES.genericCsv);
    const backParsed = await parseCsv(Papa, await back.text());

    expect(backParsed.meta.fields).toEqual(originalParsed.meta.fields);
    expect(backParsed.data).toEqual(originalParsed.data);
  });

  it("Markdown table fixture parses to the same Table shape as our util", async () => {
    // Defense-in-depth: if the converter accidentally generates valid
    // Markdown but with the wrong rows, this catches it.
    const f = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const mdResult = await run("csv-to-markdown-table", f);
    const table = parseMarkdownTable(await mdResult.blob.text());
    expect(table.headers).toEqual(["name", "age", "city"]);
    expect(table.rows).toHaveLength(3);
    expect(table.rows[0]).toEqual(["Alice", "30", "Paris"]);
    expect(table.rows[1]).toEqual(["Bob", "25", "London"]);
    expect(table.rows[2]).toEqual(["Carol", "35", "Tokyo"]);
  });

  it("HTML table converter output parses to the same Table shape", async () => {
    const f = fileFromText("test.csv", FIXTURES.genericCsv, "text/csv");
    const htmlResult = await run("csv-to-html-table", f);
    const table = parseHtmlTable(await htmlResult.blob.text());
    expect(table.headers).toEqual(["name", "age", "city"]);
    expect(table.rows).toEqual([
      ["Alice", "30", "Paris"],
      ["Bob", "25", "London"],
      ["Carol", "35", "Tokyo"],
    ]);
  });
});

// ============================================================================
// JSONL pipelines — record-count and per-record structural equality.
// ============================================================================
describe("deep: JSONL round-trip preserves all records structurally", () => {
  it("JSONL → JSON → JSONL preserves every record exactly", async () => {
    const original = fileFromText("test.jsonl", FIXTURES.jsonl, "application/jsonl");
    const json = await chain("jsonl-to-json", original);
    const back = await chain("json-to-jsonl", json);

    const originalRecords = parseJsonl(FIXTURES.jsonl);
    const backRecords = parseJsonl(await back.text());

    expect(backRecords).toHaveLength(originalRecords.length);
    expect(backRecords).toEqual(originalRecords);
  });

  it("JSONL → CSV → JSONL preserves all records (string-coerced)", async () => {
    const original = fileFromText("test.jsonl", FIXTURES.jsonl, "application/jsonl");
    const csv = await chain("jsonl-to-csv", original);
    const back = await chain("csv-to-jsonl", csv);

    const originalRecords = parseJsonl(FIXTURES.jsonl);
    const backRecords = parseJsonl(await back.text());

    // CSV doesn't preserve type info — number 30 becomes literal 30 again
    // via dynamicTyping in csv-to-jsonl, so the round-trip is structurally
    // equal at the JS-value level (not JSON-string level).
    expect(backRecords).toHaveLength(originalRecords.length);
    expect(backRecords).toEqual(originalRecords);
  });
});

// ============================================================================
// SQL dump — ROW-FOR-ROW equality, not just substring presence.
// ============================================================================
describe("deep: SQL dump round-trip is row-for-row equal", () => {
  it("CSV → SQL → parsed SQL has one row per CSV row in original order", async () => {
    const original = fileFromText("users.csv", FIXTURES.genericCsv, "text/csv");
    const sql = await chain("csv-to-sql", original);
    const dump = parseSqlDump(await sql.text());

    expect(dump.columns).toEqual(["name", "age", "city"]);
    expect(dump.rows).toHaveLength(3);
    expect(dump.rows[0]).toEqual(["Alice", 30, "Paris"]);
    expect(dump.rows[1]).toEqual(["Bob", 25, "London"]);
    expect(dump.rows[2]).toEqual(["Carol", 35, "Tokyo"]);
  });

  it("SQL → CSV preserves row count and column values", async () => {
    const Papa = (await import("papaparse")).default;
    const original = fileFromText("dump.sql", FIXTURES.sqlDump, "application/sql");
    const csv = await chain("sql-to-csv", original);
    const parsed = await parseCsv(Papa, await csv.text());

    expect(parsed.meta.fields).toEqual(["name", "age", "city"]);
    expect(parsed.data).toHaveLength(3);
    expect(parsed.data[0].name).toBe("Alice");
    expect(parsed.data[0].city).toBe("Paris");
    expect(parsed.data[2].name).toBe("Carol");
  });
});

// ============================================================================
// Color name ↔ HEX — structural equality of name list.
// ============================================================================
describe("deep: color-name round-trip returns the exact same name list", () => {
  it("name → HEX → name (147-color subset where bijection holds)", async () => {
    const original = fileFromText("colors.txt", FIXTURES.colorNames);
    const hex = await chain("color-name-to-hex", original);
    const back = await chain("hex-to-color-name", hex);

    const originalNames = FIXTURES.colorNames
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const backNames = (await back.text())
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    expect(backNames).toHaveLength(originalNames.length);
    expect(backNames).toEqual(originalNames);
  });
});

// ============================================================================
// .properties round-trip preserves keys + values structurally.
// ============================================================================
describe("deep: .properties ↔ JSON round-trip preserves the full key/value map", () => {
  it(".properties → JSON → .properties preserves every key", async () => {
    const Papa = (await import("papaparse")).default; // for parser parity
    void Papa;
    const original = fileFromText("app.properties", FIXTURES.javaProperties);
    const json = await chain("properties-to-json", original);
    const back = await chain("json-to-properties", json);

    // Parse both into key-maps and compare
    const { parseProperties } = await import("../src/lib/engine/util/properties");
    const originalMap = parseProperties(FIXTURES.javaProperties);
    const backMap = parseProperties(await back.text());

    expect(Object.keys(backMap).sort()).toEqual(Object.keys(originalMap).sort());
    expect(backMap).toEqual(originalMap);
  });
});

// ============================================================================
// .env round-trip preserves keys + values structurally.
// ============================================================================
describe("deep: .env ↔ JSON round-trip preserves the full env map", () => {
  it(".env → JSON → .env preserves all variables and their values", async () => {
    const original = fileFromText(".env", FIXTURES.env);
    const json = await chain("env-to-json", original);
    const back = await chain("json-to-env", json);

    const { parseEnv } = await import("../src/lib/engine/util/dotenv");
    const originalMap = parseEnv(FIXTURES.env);
    const backMap = parseEnv(await back.text());

    expect(Object.keys(backMap).sort()).toEqual(Object.keys(originalMap).sort());
    expect(backMap).toEqual(originalMap);
  });
});

// ============================================================================
// Date/time exact equivalence (Unix ↔ ISO 8601).
// ============================================================================
describe("deep: Unix ↔ ISO 8601 round-trip is numerically exact", () => {
  it("Unix → ISO → Unix returns the same integers in the same order", async () => {
    const original = fileFromText("timestamps.txt", FIXTURES.unixTimestamps);
    const iso = await chain("unix-to-iso", original);
    const back = await chain("iso-to-unix", iso);

    const originalNums = FIXTURES.unixTimestamps
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map(Number);
    const backNums = (await back.text())
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map(Number);

    expect(backNums).toEqual(originalNums);
  });

  it("ISO → Unix → ISO returns the same ISO strings (UTC midnight inputs)", async () => {
    const original = fileFromText("dates.txt", FIXTURES.isoDates);
    const unix = await chain("iso-to-unix", original);
    const back = await chain("unix-to-iso", unix);

    // Compare the parsed Date.parse() values rather than string forms,
    // because the formatter may use `.000Z` while the input was just `Z`.
    const originalMs = FIXTURES.isoDates
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((s) => Date.parse(s));
    const backMs = (await back.text())
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((s) => Date.parse(s));

    expect(backMs).toEqual(originalMs);
  });
});
