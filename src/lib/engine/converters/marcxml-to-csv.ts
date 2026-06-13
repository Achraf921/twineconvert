import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarcxml } from "../util/marcxml";
import { citationsToCsv } from "../util/citations-to-csv";

/**
 * MARCXML → CSV. Parses MARC21 slim XML (the format library catalogs export)
 * into the unified Citation model, then writes CSV.
 * Import-only.
 */
const marcxmlToCsv: Converter = {
  id: "marcxml-to-csv",
  label: "MARCXML → CSV",
  fromMime: ["application/marcxml+xml", "application/xml", "text/xml"],
  accept: [".xml", ".marcxml", ".mrcx"],
  toMime: "text/csv",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseMarcxml(text);
      if (citations.length === 0) throw new Error("No records found in the MARCXML file");
      out = await citationsToCsv(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MARCXML to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default marcxmlToCsv;
