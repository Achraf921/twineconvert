import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { sortRisRecords } from "../util/citation-sort";

/**
 * Alphabetize a RIS library by first-author surname, then year. Records are
 * reordered whole, so every record is preserved exactly (non-lossy); only the
 * order changes. Useful after merging exports from several databases.
 */
const risSort: Converter = {
  id: "ris-sort",
  label: "RIS Sort",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      if (!/^ER\s{0,3}-/m.test(text)) {
        throw new Error("No RIS records found (each record must end with an ER line).");
      }
      out = sortRisRecords(text);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not sort the RIS file",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-research-info-systems;charset=utf-8" }),
      filename: swapExtension(input.name, "ris"),
    };
  },
};

export default risSort;
