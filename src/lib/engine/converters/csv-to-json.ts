import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * CSV → JSON via Papa Parse. `header: true` means the first row is treated
 * as the keys for each subsequent row's object — the standard "CSV table"
 * interpretation users expect.
 */
const csvToJson: Converter = {
  id: "csv-to-json",
  label: "CSV → JSON",
  fromMime: ["text/csv", "application/csv"],
  toMime: "application/json",
  accept: [".csv"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const Papa = (await import("papaparse")).default;
      const text = await input.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      json = JSON.stringify(parsed.data, null, 2);
    } catch (err) {
      throw new ConvertFailedError("Could not parse CSV", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default csvToJson;
