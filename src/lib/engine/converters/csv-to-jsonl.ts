import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildJsonl } from "../util/jsonl";

const csvToJsonl: Converter = {
  id: "csv-to-jsonl",
  label: "CSV → JSONL",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/jsonl",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const Papa = (await import("papaparse")).default;
      const parsed = Papa.parse<Record<string, unknown>>(await input.text(), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      if (parsed.errors.length > 0) {
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      }
      out = buildJsonl(parsed.data);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to JSONL",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/jsonl;charset=utf-8" }),
      filename: swapExtension(input.name, "jsonl"),
    };
  },
};

export default csvToJsonl;
