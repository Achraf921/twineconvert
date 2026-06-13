import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { stripCsvPreamble } from "../util/csv-parse-flex";
import { buildSqlDump, type SqlTable } from "../util/sql";

const csvToSql: Converter = {
  id: "csv-to-sql",
  label: "CSV → SQL",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/sql",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let sql: string;
    try {
      const Papa = (await import("papaparse")).default;
      const { text, delimiter } = stripCsvPreamble(await input.text());
      const parsed = Papa.parse<Record<string, string | number | boolean | null>>(
        text,
        { header: true, skipEmptyLines: true, dynamicTyping: true, ...(delimiter ? { delimiter } : {}) },
      );
      if (parsed.errors.length > 0) {
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      }
      const columns = parsed.meta.fields ?? [];
      if (columns.length === 0) throw new Error("CSV has no header row");
      // Derive a sane table name from the upload filename
      const tableName = (input.name.replace(/\.[^.]+$/, "") || "data")
        .replace(/[^A-Za-z0-9_]/g, "_")
        .replace(/^(\d)/, "t_$1");
      const table: SqlTable = {
        table: tableName,
        columns,
        rows: parsed.data.map((r) => columns.map((c) => r[c] ?? null)),
      };
      sql = buildSqlDump(table);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to SQL",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([sql], { type: "application/sql;charset=utf-8" }),
      filename: swapExtension(input.name, "sql"),
    };
  },
};

export default csvToSql;
