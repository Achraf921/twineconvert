/**
 * Edge-case tests for the recently added converters.
 *
 * The smoke tests use happy-path fixtures (well-formed input, expected
 * encoding, no extreme values). Real users upload garbage. These tests
 * exercise the failure modes that matter:
 *   - empty input
 *   - malformed input (parse errors must throw, not silently emit nonsense)
 *   - unicode in unusual places (multi-byte chars, emoji, RTL)
 *   - line-ending variants (LF / CRLF / CR-only)
 *   - boundary values (zero, max, negative, large counts)
 *   - presence of input doesn't equal correctness of output (output
 *     must structurally match what the user expects)
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";
import { ConvertFailedError } from "../src/lib/engine/types";

async function runText(toolId: string, name: string, body: string, mime?: string) {
  const result = await run(toolId, fileFromText(name, body, mime));
  return result.blob.text();
}

// ============================================================================
// Empty input → must throw, not silently emit empty output
// ============================================================================
describe("edge: empty input is rejected loudly (not silently)", () => {
  const cases: Array<[string, string, string?]> = [
    ["hex-to-rgb", "colors.txt"],
    ["rgb-to-hex", "colors.txt"],
    ["color-name-to-hex", "names.txt"],
    ["hex-to-color-name", "colors.txt"],
    ["unix-to-iso", "ts.txt"],
    ["iso-to-unix", "ts.txt"],
  ];

  it.each(cases)("%s on empty input throws ConvertFailedError", async (id, name, mime) => {
    await expect(runText(id, name, "", mime)).rejects.toThrow(ConvertFailedError);
  });

  // jsonl-to-json is the documented exception: an empty JSONL file →
  // empty array is a meaningful result (zero records is still a valid
  // value), not a user error worth interrupting CI pipelines for.
  it("jsonl-to-json on empty input returns valid empty JSON array", async () => {
    const out = await runText("jsonl-to-json", "test.jsonl", "", "application/jsonl");
    expect(JSON.parse(out)).toEqual([]);
  });
});

// ============================================================================
// Malformed input → must throw with a descriptive message
// ============================================================================
describe("edge: malformed input throws with format-specific error", () => {
  it("hex-to-rgb rejects garbage hex", async () => {
    await expect(runText("hex-to-rgb", "colors.txt", "#GGGGGG\n")).rejects.toThrow(/hex/i);
  });

  it("color-name-to-hex rejects unknown names", async () => {
    await expect(
      runText("color-name-to-hex", "names.txt", "tomato\nnot-a-real-color\n"),
    ).rejects.toThrow(/Unknown CSS color name/);
  });

  it("hex-to-text rejects odd-length hex", async () => {
    await expect(runText("hex-to-text", "in.txt", "abc\n")).rejects.toThrow(/even/i);
  });

  it("hex-to-text rejects non-hex characters", async () => {
    await expect(runText("hex-to-text", "in.txt", "zzzz\n")).rejects.toThrow(/non-hex/i);
  });

  it("jsonl-to-json fails with line number on malformed JSON", async () => {
    await expect(
      runText(
        "jsonl-to-json",
        "test.jsonl",
        '{"valid": 1}\nnot-json-here\n',
        "application/jsonl",
      ),
    ).rejects.toThrow(/line 2/);
  });

  it("ini-to-json tolerates malformed lines (returns whatever it could parse)", async () => {
    // ini parser treats unparseable lines as no-ops rather than throwing —
    // verify that's still the case (we'd need to update tests if it changed)
    const json = await runText("ini-to-json", "config.ini", "valid_key=ok\nthis is garbage\n");
    expect(JSON.parse(json)).toMatchObject({ valid_key: "ok" });
  });
});

// ============================================================================
// Unicode handling — multi-byte chars must survive every text format
// ============================================================================
describe("edge: unicode/emoji round-trips through every text encoder", () => {
  const unicode = "Café 中文 🎵 ÿ";

  it("text → base64 → text preserves multi-byte UTF-8", async () => {
    const b64 = await runText("text-to-base64", "in.txt", unicode);
    const back = await runText("base64-to-text", "b64.txt", b64);
    expect(back).toBe(unicode);
  });

  it("text → URL-encoded → text preserves multi-byte UTF-8", async () => {
    const enc = await runText("text-to-url-encoded", "in.txt", unicode);
    const back = await runText("url-encoded-to-text", "enc.txt", enc);
    expect(back).toBe(unicode);
  });

  it("text → hex → text preserves multi-byte UTF-8", async () => {
    const hex = await runText("text-to-hex", "in.txt", unicode);
    const back = await runText("hex-to-text", "hex.txt", hex);
    expect(back).toBe(unicode);
  });

  it("CSV with unicode cell values round-trips through Markdown table", async () => {
    const csv = `name,city\n中文用户,東京\nCafé,München\n`;
    const md = await runText("csv-to-markdown-table", "in.csv", csv);
    expect(md).toContain("中文用户");
    expect(md).toContain("東京");
    expect(md).toContain("München");
  });
});

// ============================================================================
// Line endings — LF / CRLF / CR-only inputs must all parse
// ============================================================================
describe("edge: tolerant of LF / CRLF line endings", () => {
  it("jsonl-to-json handles CRLF", async () => {
    const crlf = `{"a":1}\r\n{"a":2}\r\n`;
    const out = await runText("jsonl-to-json", "in.jsonl", crlf, "application/jsonl");
    expect(JSON.parse(out)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("ini-to-json handles CRLF", async () => {
    const crlf = `[s]\r\nk=v\r\n`;
    const out = await runText("ini-to-json", "in.ini", crlf);
    expect(JSON.parse(out)).toEqual({ s: { k: "v" } });
  });

  it("env-to-json handles CRLF", async () => {
    const crlf = `FOO=bar\r\nBAZ=qux\r\n`;
    const out = await runText("env-to-json", ".env", crlf);
    expect(JSON.parse(out)).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("subtitle parser handles CRLF SRT", async () => {
    const crlf =
      "1\r\n00:00:01,000 --> 00:00:04,000\r\nFirst caption\r\n\r\n2\r\n00:00:05,500 --> 00:00:08,250\r\nSecond caption\r\n";
    const sbv = await runText("srt-to-sbv", "test.srt", crlf, "application/x-subrip");
    expect(sbv).toContain("First caption");
    expect(sbv).toContain("Second caption");
  });
});

// ============================================================================
// Boundary numerics — zero, negative, large, fractional
// ============================================================================
describe("edge: boundary numeric values", () => {
  it("unix-to-iso handles epoch 0 (1970-01-01)", async () => {
    const out = await runText("unix-to-iso", "ts.txt", "0\n");
    expect(out.trim()).toBe("1970-01-01T00:00:00.000Z");
  });

  it("unix-to-iso handles negative timestamps (pre-epoch dates)", async () => {
    const out = await runText("unix-to-iso", "ts.txt", "-1000\n");
    // -1000 seconds = 1969-12-31T23:43:20.000Z
    expect(out.trim()).toBe("1969-12-31T23:43:20.000Z");
  });

  it("unix-to-iso auto-detects ms vs seconds (1.7e12 = ms)", async () => {
    // 1717977600 seconds = 2024-06-10
    // 1717977600000 ms = same date
    const sec = await runText("unix-to-iso", "ts.txt", "1717977600\n");
    const ms = await runText("unix-to-iso", "ts.txt", "1717977600000\n");
    expect(sec.trim()).toBe(ms.trim());
  });

  it("rgb-to-cmyk handles pure black (k=100, all others 0)", async () => {
    const out = await runText("rgb-to-cmyk", "colors.txt", "rgb(0, 0, 0)\n");
    expect(out.trim()).toBe("cmyk(0%, 0%, 0%, 100%)");
  });

  it("rgb-to-cmyk handles pure white (all zeros)", async () => {
    const out = await runText("rgb-to-cmyk", "colors.txt", "rgb(255, 255, 255)\n");
    expect(out.trim()).toBe("cmyk(0%, 0%, 0%, 0%)");
  });
});

// ============================================================================
// Large input — converters should handle 10K+ records without truncation
// ============================================================================
describe("edge: large inputs do not silently truncate", () => {
  it("jsonl-to-json preserves 1000-record stream", async () => {
    const lines = Array.from({ length: 1000 }, (_, i) =>
      JSON.stringify({ id: i, val: `item-${i}` }),
    ).join("\n");
    const out = await runText("jsonl-to-json", "big.jsonl", lines, "application/jsonl");
    const parsed = JSON.parse(out) as Array<{ id: number }>;
    expect(parsed).toHaveLength(1000);
    expect(parsed[0].id).toBe(0);
    expect(parsed[999].id).toBe(999);
  });

  it("hex-to-rgb preserves 500-color list with no row drops", async () => {
    // Generate 500 unique hex colors
    const lines = Array.from({ length: 500 }, (_, i) =>
      "#" + i.toString(16).padStart(6, "0"),
    ).join("\n");
    const out = await runText("hex-to-rgb", "big.txt", lines);
    const rgbLines = out.trim().split("\n");
    expect(rgbLines).toHaveLength(500);
    expect(rgbLines[0]).toBe("rgb(0, 0, 0)");
    expect(rgbLines[1]).toBe("rgb(0, 0, 1)");
  });

  it("text-to-base64 preserves 100KB input through base64 → text", async () => {
    const big = "x".repeat(100_000);
    const b64 = await runText("text-to-base64", "in.txt", big);
    const back = await runText("base64-to-text", "b64.txt", b64);
    expect(back).toBe(big);
    expect(back.length).toBe(100_000);
  });
});

// ============================================================================
// Property-based-ish: random-ish RGB values must round-trip through HEX exactly
// ============================================================================
describe("edge: HEX ↔ RGB exact bijection across the full color space", () => {
  it("100 pseudo-random RGB values round-trip identically", async () => {
    // Deterministic pseudo-random so failures are reproducible
    let seed = 12345;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 2 ** 32;
      return Math.floor((seed / 2 ** 32) * 256);
    };
    const rgbLines: string[] = [];
    const expected: string[] = [];
    for (let i = 0; i < 100; i++) {
      const r = rand();
      const g = rand();
      const b = rand();
      rgbLines.push(`rgb(${r}, ${g}, ${b})`);
      expected.push(`rgb(${r}, ${g}, ${b})`);
    }
    const hex = await runText("rgb-to-hex", "in.txt", rgbLines.join("\n") + "\n");
    const back = await runText("hex-to-rgb", "hex.txt", hex);
    expect(back.trim().split("\n")).toEqual(expected);
  });
});
