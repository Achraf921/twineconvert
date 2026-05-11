import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * TSV → CSV. Re-quote fields that contain commas, double quotes, or
 * line breaks per RFC 4180. Tab characters are dropped on the way in
 * (they're the field delimiter and TSV doesn't support escaped tabs).
 */
const tsvToCsv: Converter = {
  id: "tsv-to-csv",
  label: "TSV → CSV",
  fromMime: ["text/tab-separated-values", "text/plain"],
  accept: [".tsv", ".tab"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const text = await input.text();
      const rows = text
        .split(/\r?\n/)
        .filter((line, idx, arr) => line !== "" || idx < arr.length - 1)
        .map((line) => line.split("\t"));
      csv = rows
        .map((row) => row.map(quoteCsvField).join(","))
        .join("\r\n");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert TSV to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

function quoteCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default tsvToCsv;
