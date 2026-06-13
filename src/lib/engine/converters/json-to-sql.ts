import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildSqlDump, type SqlTable } from "../util/sql";
import { parseJsonInput } from "../util/parse-json-input";

/**
 * JSON array of objects → SQL CREATE TABLE + INSERT statements. Column set
 * is the union of keys across the input array (handles sparse rows the
 * way Postgres COPY would).
 */
const jsonToSql: Converter = {
  id: "json-to-sql",
  label: "JSON → SQL",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/sql",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let sql: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const records = arr.filter(
        (v): v is Record<string, unknown> =>
          typeof v === "object" && v !== null && !Array.isArray(v),
      );
      if (records.length === 0) {
        throw new Error("JSON must be an array of objects (or a single object)");
      }
      const columns = Array.from(
        records.reduce((set, r) => {
          for (const k of Object.keys(r)) set.add(k);
          return set;
        }, new Set<string>()),
      );
      const tableName = (input.name.replace(/\.[^.]+$/, "") || "data")
        .replace(/[^A-Za-z0-9_]/g, "_")
        .replace(/^(\d)/, "t_$1");
      const coerce = (v: unknown): string | number | boolean | null => {
        if (v === null || v === undefined) return null;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
        return JSON.stringify(v);
      };
      const table: SqlTable = {
        table: tableName,
        columns,
        rows: records.map((r) => columns.map((c) => coerce(r[c]))),
      };
      sql = buildSqlDump(table);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to SQL",
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

export default jsonToSql;
