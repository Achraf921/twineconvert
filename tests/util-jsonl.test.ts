/**
 * Deep unit tests for jsonl.ts. JSONL is the most-touched format in modern
 * data pipelines, so the parser/builder pair has to handle the messy
 * variants real systems emit.
 */

import { describe, it, expect } from "vitest";
import { parseJsonl, buildJsonl } from "../src/lib/engine/util/jsonl";

describe("jsonl: parse", () => {
  it("returns one value per non-blank line", () => {
    const input = `{"name":"Alice"}
{"name":"Bob"}
{"name":"Carol"}`;
    expect(parseJsonl(input)).toEqual([
      { name: "Alice" },
      { name: "Bob" },
      { name: "Carol" },
    ]);
  });

  it("skips blank lines", () => {
    const input = `{"a":1}

{"a":2}


{"a":3}
`;
    expect(parseJsonl(input)).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it("handles CRLF line endings", () => {
    const input = `{"a":1}\r\n{"a":2}\r\n`;
    expect(parseJsonl(input)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("supports primitives, arrays, and nested objects per line", () => {
    const input = `42
"hello"
[1, 2, 3]
{"nested": {"a": 1}}
true
null`;
    expect(parseJsonl(input)).toEqual([
      42,
      "hello",
      [1, 2, 3],
      { nested: { a: 1 } },
      true,
      null,
    ]);
  });

  it("throws with a clear line number on malformed JSON", () => {
    const input = `{"a":1}
not-valid-json
{"a":3}`;
    expect(() => parseJsonl(input)).toThrow(/line 2/);
  });

  it("returns empty array for empty input", () => {
    expect(parseJsonl("")).toEqual([]);
    expect(parseJsonl("\n\n\n")).toEqual([]);
  });
});

describe("jsonl: build", () => {
  it("emits one JSON value per line with trailing LF", () => {
    const out = buildJsonl([{ a: 1 }, { a: 2 }]);
    expect(out).toBe('{"a":1}\n{"a":2}\n');
  });

  it("never pretty-prints (line break IS the structure)", () => {
    const out = buildJsonl([{ a: { b: { c: 1 } } }]);
    expect(out).toBe('{"a":{"b":{"c":1}}}\n');
    expect(out.split("\n").filter(Boolean).length).toBe(1);
  });

  it("emits empty string for empty array", () => {
    expect(buildJsonl([])).toBe("\n");
  });
});

describe("jsonl: round-trip exactness for any value array", () => {
  const cases: unknown[][] = [
    [{ a: 1 }, { a: 2 }, { a: 3 }],
    [42, "hello", [1, 2, 3], null, true, false],
    [{ a: { b: { c: { d: { e: 1 } } } } }],
    Array.from({ length: 1000 }, (_, i) => ({ id: i, val: `item ${i}` })),
  ];

  it.each(cases.map((c, i) => [i, c] as const))("case #%d round-trips structurally", (_i, vals) => {
    const text = buildJsonl(vals);
    expect(parseJsonl(text)).toEqual(vals);
  });
});
