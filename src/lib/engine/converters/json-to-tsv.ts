import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const jsonToTsv: Converter = {
  id: "json-to-tsv",
  label: "JSON → TSV",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/tab-separated-values",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let tsv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const parsed: unknown = JSON.parse(await input.text());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const records = arr.filter(
        (v): v is Record<string, unknown> =>
          typeof v === "object" && v !== null && !Array.isArray(v),
      );
      if (records.length === 0) {
        throw new Error("JSON must be an array of objects (or a single object)");
      }
      tsv = Papa.unparse(records, { delimiter: "\t", newline: "\n" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to TSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([tsv + "\n"], { type: "text/tab-separated-values;charset=utf-8" }),
      filename: swapExtension(input.name, "tsv"),
    };
  },
};

export default jsonToTsv;
