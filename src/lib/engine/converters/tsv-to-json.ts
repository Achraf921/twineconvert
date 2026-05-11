import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const tsvToJson: Converter = {
  id: "tsv-to-json",
  label: "TSV → JSON",
  fromMime: ["text/tab-separated-values", "text/plain"],
  accept: [".tsv"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const Papa = (await import("papaparse")).default;
      const parsed = Papa.parse<Record<string, unknown>>(await input.text(), {
        header: true,
        skipEmptyLines: true,
        delimiter: "\t",
        dynamicTyping: true,
      });
      if (parsed.errors.length > 0) {
        throw new Error(`TSV parse error: ${parsed.errors[0].message}`);
      }
      out = JSON.stringify(parsed.data, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert TSV to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default tsvToJson;
