/**
 * Minimal SQL dump helpers — emit and parse the lowest-common-denominator
 * `CREATE TABLE` + `INSERT INTO` syntax that all major engines accept
 * (Postgres, MySQL, SQLite, SQL Server). No engine-specific extensions.
 *
 * The parser handles `INSERT INTO table (cols) VALUES (...)` statements
 * with single-quoted strings, NULL, integers, decimals, and booleans.
 * It deliberately ignores DDL, comments, transactions, and triggers —
 * those don't fit the tabular round-trip model anyway.
 */

export interface SqlTable {
  table: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

// ---- Identifier helpers --------------------------------------------------

const SQL_KEYWORDS = new Set([
  "select", "from", "where", "insert", "into", "values", "create", "table",
  "drop", "alter", "update", "delete", "set", "join", "on", "as", "and",
  "or", "not", "null", "true", "false", "primary", "key", "foreign",
]);

function quoteIdent(name: string): string {
  // ANSI SQL uses double quotes; safe across PG/SQLite/SQLServer. MySQL
  // uses backticks but accepts " when ANSI_QUOTES is set; we trade strict
  // MySQL compatibility for portability across engines.
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !SQL_KEYWORDS.has(name.toLowerCase())) {
    return name;
  }
  return `"${name.replace(/"/g, '""')}"`;
}

function quoteValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "NULL";
    return String(value);
  }
  // Strings: single-quoted with embedded `'` doubled (ANSI standard)
  return `'${String(value).replace(/'/g, "''")}'`;
}

// ---- Emit ----------------------------------------------------------------

/** Build a self-contained CREATE TABLE + INSERT statements dump. */
export function buildSqlDump(table: SqlTable): string {
  const lines: string[] = [];
  const tableId = quoteIdent(table.table);
  lines.push(`-- ${table.rows.length} row${table.rows.length === 1 ? "" : "s"}`);
  lines.push(`DROP TABLE IF EXISTS ${tableId};`);
  // Infer column types from first non-null value in each column. Fall back
  // to TEXT when we can't tell — broadest type, accepted by every engine.
  const types = table.columns.map((_, i) => {
    for (const r of table.rows) {
      const v = r[i];
      if (v == null || v === "") continue;
      if (typeof v === "boolean") return "BOOLEAN";
      if (typeof v === "number") return Number.isInteger(v) ? "INTEGER" : "REAL";
      return "TEXT";
    }
    return "TEXT";
  });
  const colDefs = table.columns
    .map((c, i) => `  ${quoteIdent(c)} ${types[i]}`)
    .join(",\n");
  lines.push(`CREATE TABLE ${tableId} (\n${colDefs}\n);`);
  lines.push("");
  const colList = table.columns.map(quoteIdent).join(", ");
  for (const row of table.rows) {
    const valList = row.map(quoteValue).join(", ");
    lines.push(`INSERT INTO ${tableId} (${colList}) VALUES (${valList});`);
  }
  return lines.join("\n") + "\n";
}

// ---- Parse ---------------------------------------------------------------

/**
 * Parse a SQL dump into a SqlTable. Looks for the FIRST table referenced by
 * an `INSERT INTO` and collects all rows for it. Multi-table dumps lose the
 * extra tables — the round-trip model is one table per CSV.
 */
export function parseSqlDump(text: string): SqlTable {
  const insertRe = /insert\s+into\s+("[^"]+"|`[^`]+`|\w+)\s*\(([^)]+)\)\s*values\s*\(([^;]+?)\)\s*;/gi;
  const matches = [...text.matchAll(insertRe)];
  if (matches.length === 0) {
    throw new Error("SQL has no recognizable INSERT INTO ... VALUES (...) statements");
  }

  const stripIdent = (s: string) => s.replace(/^["`]/, "").replace(/["`]$/, "");
  const tableName = stripIdent(matches[0][1]);
  const columns = matches[0][2]
    .split(",")
    .map((c) => stripIdent(c.trim()));

  const parseValueList = (raw: string): (string | number | boolean | null)[] => {
    const out: (string | number | boolean | null)[] = [];
    // Walk char-by-char so we correctly handle quoted strings with commas
    let i = 0;
    while (i < raw.length) {
      while (i < raw.length && /\s/.test(raw[i])) i++;
      if (i >= raw.length) break;
      if (raw[i] === "'") {
        // Quoted string; '' is escaped single quote
        let j = i + 1;
        let str = "";
        while (j < raw.length) {
          if (raw[j] === "'" && raw[j + 1] === "'") {
            str += "'";
            j += 2;
          } else if (raw[j] === "'") {
            j++;
            break;
          } else {
            str += raw[j];
            j++;
          }
        }
        out.push(str);
        i = j;
      } else {
        // Bare token: NULL / TRUE / FALSE / number
        let j = i;
        while (j < raw.length && raw[j] !== ",") j++;
        const tok = raw.slice(i, j).trim();
        if (/^null$/i.test(tok)) out.push(null);
        else if (/^true$/i.test(tok)) out.push(true);
        else if (/^false$/i.test(tok)) out.push(false);
        else if (/^-?\d+$/.test(tok)) out.push(parseInt(tok, 10));
        else if (/^-?\d*\.\d+$/.test(tok)) out.push(parseFloat(tok));
        else out.push(tok); // unquoted text (rare; tolerate)
        i = j;
      }
      while (i < raw.length && /\s/.test(raw[i])) i++;
      if (raw[i] === ",") i++;
    }
    return out;
  };

  const rows = matches
    .filter((m) => stripIdent(m[1]) === tableName)
    .map((m) => parseValueList(m[3]));

  return { table: tableName, columns, rows };
}
