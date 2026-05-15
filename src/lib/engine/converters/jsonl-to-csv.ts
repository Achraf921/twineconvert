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
      const rawText = await input.text();
      // Most common misuse caught via PostHog convert_error: a user
      // uploads a normal pretty-printed .json file (a single array or
      // object spanning many lines) thinking it's JSONL. parseJsonl is
      // strict per-line, so it dies on line 1 with a cryptic
      // "Unexpected end of JSON input". Detect that here and point them
      // at the right tool instead.
      const head = rawText.replace(/^﻿/, "").trimStart();
      if (head.startsWith("[")) {
        throw new Error(
          "This looks like a JSON array, not JSONL. JSONL is one complete JSON object per line, with no enclosing [ ]. Use the json-to-csv tool for a regular .json file.",
        );
      }
      if (head.startsWith("{") && /\n\s*"/.test(head.slice(0, 200))) {
        throw new Error(
          "This looks like a pretty-printed JSON object spanning multiple lines, not JSONL. JSONL needs one complete JSON value per single line. Use json-to-csv for a regular .json file, or minify each record to one line.",
        );
      }
      const records = parseJsonl(rawText).filter(
        (v): v is Record<string, unknown> =>
          typeof v === "object" && v !== null && !Array.isArray(v),
      );
      if (records.length === 0) {
        throw new Error(
          "No JSON-object records found. JSONL must be one JSON object per line (e.g. {\"a\":1} on its own line). Arrays of primitives and bare values can't be flattened into CSV rows.",
        );
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
