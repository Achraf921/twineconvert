/**
 * Tabular conversion helpers — CSV / Markdown table / HTML table share a
 * simple row-of-cells model. Each direction has a small parser + emitter.
 *
 * Markdown table format (GitHub-flavored):
 *   | name | age | city  |
 *   |------|-----|-------|
 *   | Alice| 30  | Paris |
 *   | Bob  | 25  | London|
 *
 * HTML table format: standard <table><tr><th>...</th></tr><tr><td>...</td></tr></table>.
 * We accept both `<th>` and `<td>` for the header row (some emitters use td).
 */

export interface Table {
  /** First row, used as column headers when emitting Markdown/HTML. */
  headers: string[];
  /** Each row is an ordered array, same length as headers. */
  rows: string[][];
}

// ---- Markdown ------------------------------------------------------------

export function parseMarkdownTable(text: string): Table {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  if (lines.length < 2) {
    throw new Error("Markdown table requires header + separator + at least one row");
  }
  const splitRow = (line: string): string[] => {
    return line
      .replace(/^\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((c) => c.trim());
  };
  const headers = splitRow(lines[0]);
  // Line 1 is the separator row (|---|---|), skip it
  const rows = lines.slice(2).map(splitRow);
  return { headers, rows };
}

export function buildMarkdownTable(table: Table): string {
  const widths = table.headers.map((h, i) => {
    const cellLengths = table.rows.map((r) => (r[i] ?? "").length);
    return Math.max(3, h.length, ...cellLengths);
  });
  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));
  const headerLine = "| " + table.headers.map((h, i) => pad(h, widths[i])).join(" | ") + " |";
  const sepLine = "|" + widths.map((w) => "-".repeat(w + 2)).join("|") + "|";
  const rowLines = table.rows.map(
    (r) => "| " + table.headers.map((_, i) => pad(r[i] ?? "", widths[i])).join(" | ") + " |",
  );
  return [headerLine, sepLine, ...rowLines].join("\n") + "\n";
}

// ---- HTML ----------------------------------------------------------------

/**
 * Parse the first `<table>` from an HTML document. Regex-based on purpose:
 * we only care about rows + cells, and full HTML parsing isn't worth the
 * dependency weight (cheerio adds ~1MB).
 */
export function parseHtmlTable(html: string): Table {
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) throw new Error("No <table> element found in HTML");
  const tableContent = tableMatch[0];

  const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").trim();
  const decode = (s: string) =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");

  const rows: string[][] = [];
  const rowMatches = tableContent.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const rowMatch of rowMatches) {
    const cellMatches = rowMatch[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi);
    const cells: string[] = [];
    for (const cellMatch of cellMatches) {
      cells.push(decode(stripTags(cellMatch[1])));
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) throw new Error("Table has no rows");
  return { headers: rows[0], rows: rows.slice(1) };
}

export function buildHtmlTable(table: Table): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const headerRow =
    "    <tr>" +
    table.headers.map((h) => `<th>${escape(h)}</th>`).join("") +
    "</tr>";
  const bodyRows = table.rows.map(
    (r) =>
      "    <tr>" +
      table.headers.map((_, i) => `<td>${escape(r[i] ?? "")}</td>`).join("") +
      "</tr>",
  );

  return [
    "<table>",
    "  <thead>",
    headerRow,
    "  </thead>",
    "  <tbody>",
    ...bodyRows,
    "  </tbody>",
    "</table>",
    "",
  ].join("\n");
}

// ---- CSV bridge (uses papaparse via caller; this util stays dep-free) ----

export function csvRowsToTable(rows: string[][]): Table {
  if (rows.length === 0) throw new Error("CSV has no rows");
  return { headers: rows[0], rows: rows.slice(1) };
}

export function tableToCsvRows(table: Table): string[][] {
  return [table.headers, ...table.rows];
}

/** Table -> array of row objects keyed by header (the shape JSON tools expect). */
export function tableToObjects(table: Table): Record<string, string>[] {
  return table.rows.map((row) => {
    const obj: Record<string, string> = {};
    table.headers.forEach((h, i) => {
      obj[h || `column${i + 1}`] = row[i] ?? "";
    });
    return obj;
  });
}

/** Array of row objects -> Table. Headers are the union of keys in first-seen order. */
export function objectsToTable(objs: unknown): Table {
  if (!Array.isArray(objs)) {
    throw new Error("JSON must be an array of row objects to build a table.");
  }
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const o of objs) {
    if (o && typeof o === "object" && !Array.isArray(o)) {
      for (const k of Object.keys(o)) {
        if (!seen.has(k)) {
          seen.add(k);
          headers.push(k);
        }
      }
    }
  }
  if (headers.length === 0) {
    throw new Error("JSON rows have no fields; nothing to tabulate.");
  }
  const rows = objs.map((o) =>
    headers.map((h) => {
      const v = (o as Record<string, unknown>)?.[h];
      if (v == null) return "";
      return typeof v === "object" ? JSON.stringify(v) : String(v);
    }),
  );
  return { headers, rows };
}
