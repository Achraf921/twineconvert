import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON → CSV. Expects the JSON to be an array of objects (the standard
 * tabular shape). Nested objects/arrays get JSON-stringified into single
 * cells — Papa's default behavior, which matches what tools like Excel's
 * Power Query produce.
 */
const jsonToCsv: Converter = {
  id: "json-to-csv",
  label: "JSON → CSV",
  fromMime: ["application/json"],
  toMime: "text/csv",
  accept: [".json"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const text = await input.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error("JSON must be an array of objects to convert to CSV");
      }
      csv = Papa.unparse(data);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to CSV",
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

export default jsonToCsv;
