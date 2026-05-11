/**
 * Deep unit tests for sql.ts and tables.ts. These power the data-pipeline
 * tools that downstream users put in their own ETL — silent corruption
 * here corrupts user data, so structural round-trips have to hold.
 */

import { describe, it, expect } from "vitest";
import { parseSqlDump, buildSqlDump, type SqlTable } from "../src/lib/engine/util/sql";
import {
  parseMarkdownTable,
  buildMarkdownTable,
  parseHtmlTable,
  buildHtmlTable,
} from "../src/lib/engine/util/tables";

// ---- SQL ----------------------------------------------------------------

describe("sql: build emits portable CREATE TABLE + INSERT INTO", () => {
  const table: SqlTable = {
    table: "users",
    columns: ["id", "name", "balance", "active"],
    rows: [
      [1, "Alice", 1234.56, true],
      [2, "Bob's Café", null, false],
      [3, "Carol", -50, true],
    ],
  };

  it("emits one INSERT per row", () => {
    const sql = buildSqlDump(table);
    expect((sql.match(/INSERT INTO/g) ?? []).length).toBe(3);
  });

  it("uses ANSI single-quote escaping for embedded apostrophes", () => {
    const sql = buildSqlDump(table);
    // "Bob's Café" must become 'Bob''s Café'
    expect(sql).toContain("'Bob''s Café'");
  });

  it("emits NULL (not 'null') for null values", () => {
    const sql = buildSqlDump(table);
    expect(sql).toMatch(/VALUES\s*\(\s*2,\s*'Bob''s Café',\s*NULL,/);
  });

  it("emits TRUE/FALSE (not 'true'/'false') for booleans", () => {
    const sql = buildSqlDump(table);
    expect(sql).toMatch(/TRUE/);
    expect(sql).toMatch(/FALSE/);
  });

  it("infers column types from non-null values", () => {
    const sql = buildSqlDump(table);
    // id column: all integers → INTEGER
    expect(sql).toMatch(/id\s+INTEGER/);
    // balance: REAL (has 1234.56)
    expect(sql).toMatch(/balance\s+REAL/);
    // active: BOOLEAN
    expect(sql).toMatch(/active\s+BOOLEAN/);
    // name: TEXT (string fallback)
    expect(sql).toMatch(/name\s+TEXT/);
  });
});

describe("sql: parse handles the syntax build emits", () => {
  it("round-trip preserves all rows + values exactly", () => {
    const original: SqlTable = {
      table: "users",
      columns: ["id", "name", "active"],
      rows: [
        [1, "Alice", true],
        [2, "Bob's", false],
        [3, "Carol with, comma", true],
      ],
    };
    const dump = buildSqlDump(original);
    const back = parseSqlDump(dump);

    expect(back.table).toBe("users");
    expect(back.columns).toEqual(["id", "name", "active"]);
    expect(back.rows).toEqual(original.rows);
  });

  it("parses single-quoted strings with embedded ''", () => {
    const sql = `CREATE TABLE t (n TEXT);\nINSERT INTO t (n) VALUES ('Bob''s');`;
    expect(parseSqlDump(sql).rows).toEqual([["Bob's"]]);
  });

  it("preserves commas inside quoted strings (not parsed as value separators)", () => {
    const sql = `INSERT INTO t (n) VALUES ('Hello, world!');`;
    expect(parseSqlDump(sql).rows).toEqual([["Hello, world!"]]);
  });

  it("parses NULL / TRUE / FALSE / numbers correctly", () => {
    const sql = `INSERT INTO t (a, b, c, d, e) VALUES (NULL, TRUE, false, 42, -3.14);`;
    expect(parseSqlDump(sql).rows).toEqual([[null, true, false, 42, -3.14]]);
  });

  it("throws when no INSERT statements are present", () => {
    expect(() => parseSqlDump("CREATE TABLE t (a INT);")).toThrow(/INSERT/);
  });
});

// ---- Tabular tables -----------------------------------------------------

describe("tables: Markdown round-trips with structural equality", () => {
  it("buildMarkdownTable → parseMarkdownTable preserves headers + rows", () => {
    const original = {
      headers: ["name", "age", "city"],
      rows: [
        ["Alice", "30", "Paris"],
        ["Bob", "25", "London"],
        ["Carol", "35", "Tokyo"],
      ],
    };
    const md = buildMarkdownTable(original);
    const back = parseMarkdownTable(md);
    expect(back.headers).toEqual(original.headers);
    expect(back.rows).toEqual(original.rows);
  });

  it("renders pipes as column separators with consistent column widths", () => {
    const md = buildMarkdownTable({
      headers: ["a", "longheader"],
      rows: [["x", "y"]],
    });
    // First column should be padded to at least 3 chars (min width)
    // Second column should be padded to "longheader" width
    const lines = md.split("\n");
    expect(lines[0].includes("longheader")).toBe(true);
    // Separator row uses dashes
    expect(lines[1]).toMatch(/^\|-+\|-+\|$/);
  });

  it("rejects malformed input (no separator row)", () => {
    expect(() => parseMarkdownTable("| just one line |")).toThrow();
  });
});

describe("tables: HTML round-trips with structural equality", () => {
  it("buildHtmlTable → parseHtmlTable preserves data", () => {
    const original = {
      headers: ["name", "age"],
      rows: [
        ["Alice", "30"],
        ["Bob", "25"],
      ],
    };
    const html = buildHtmlTable(original);
    const back = parseHtmlTable(html);
    expect(back.headers).toEqual(original.headers);
    expect(back.rows).toEqual(original.rows);
  });

  it("escapes HTML metacharacters in cell values", () => {
    const html = buildHtmlTable({
      headers: ["a"],
      rows: [["<script>alert(1)</script>"]],
    });
    // Must not contain raw <script> (XSS surface)
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("decodes HTML entities back on parse", () => {
    const html =
      "<table><tr><th>name</th></tr><tr><td>A &amp; B</td></tr><tr><td>C &lt; D</td></tr></table>";
    expect(parseHtmlTable(html).rows).toEqual([["A & B"], ["C < D"]]);
  });

  it("accepts <th> OR <td> in the header row", () => {
    const tdHeader =
      "<table><tr><td>name</td><td>age</td></tr><tr><td>Alice</td><td>30</td></tr></table>";
    expect(parseHtmlTable(tdHeader).headers).toEqual(["name", "age"]);
  });

  it("ignores attributes and inline styles", () => {
    const html = `<table class="data" id="t1">
  <tr><th colspan="1" style="color:red">name</th></tr>
  <tr><td class="cell">Alice</td></tr>
</table>`;
    expect(parseHtmlTable(html).rows).toEqual([["Alice"]]);
  });

  it("throws when no <table> is present", () => {
    expect(() => parseHtmlTable("<div>no table here</div>")).toThrow(/<table>/);
  });
});
