import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { buildMods } from "../util/mods";

/**
 * CSV → MODS. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const csvToMods: Converter = {
  id: "csv-to-mods",
  label: "CSV → MODS",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/mods+xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = await citationsFromCsv(text);
      if (citations.length === 0) throw new Error("No references found in the CSV file");
      out = buildMods(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to MODS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/mods+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "xml"),
    };
  },
};

export default csvToMods;
