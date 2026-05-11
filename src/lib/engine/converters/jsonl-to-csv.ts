import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseJsonl } from "../util/jsonl";

/**
 * JSONL → CSV. Pivots a stream of JSON objects into a flat tabular view.
 * Header row is the union of all keys seen across the stream (the typical
 * sparse-object pipeline output, e.g. Postgres rows with NULLable cols).
 */
const jsonlToCsv: Converter = {
  id: "jsonl-to-csv",
  label: "JSONL → CSV",
  fromMime: ["application/jsonl", "application/x-ndjson", "text/plain"],
  accept: [".jsonl", ".ndjson"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const records = parseJsonl(await input.text()).filter(
        (v): v is Record<string, unknown> =>
          typeof v === "object" && v !== null && !Array.isArray(v),
      );
      if (records.length === 0) {
        throw new Error("JSONL has no JSON-object records to flatten into CSV");
      }
      // Union of keys across all records → stable column order
      const columns = Array.from(
        records.reduce((set, r) => {
          for (const k of Object.keys(r)) set.add(k);
          return set;
        }, new Set<string>()),
      );
      csv = Papa.unparse(
        { fields: columns, data: records.map((r) => columns.map((c) => r[c] ?? "")) },
        { newline: "\n" }, // see markdown-table-to-csv for the CRLF/LF bug
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSONL to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv + "\n"], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default jsonlToCsv;
