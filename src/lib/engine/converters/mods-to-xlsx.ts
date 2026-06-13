import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMods } from "../util/mods";
import { citationsToCsv } from "../util/citations-to-csv";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * MODS → XLSX. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const modsToXlsx: Converter = {
  id: "mods-to-xlsx",
  label: "MODS → XLSX",
  fromMime: ["application/mods+xml", "application/xml", "text/xml"],
  accept: [".xml", ".mods"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const text = await input.text();
      const citations = parseMods(text);
      if (citations.length === 0) throw new Error("No references found in the MODS file");
      const csv = await citationsToCsv(citations);
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MODS to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default modsToXlsx;
