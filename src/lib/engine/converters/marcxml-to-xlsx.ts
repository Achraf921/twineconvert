import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarcxml } from "../util/marcxml";
import { citationsToCsv } from "../util/citations-to-csv";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * MARCXML → XLSX. Parses MARC21 slim XML (the format library catalogs export)
 * into the unified Citation model, then writes XLSX.
 * Import-only.
 */
const marcxmlToXlsx: Converter = {
  id: "marcxml-to-xlsx",
  label: "MARCXML → XLSX",
  fromMime: ["application/marcxml+xml", "application/xml", "text/xml"],
  accept: [".xml", ".marcxml", ".mrcx"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const text = await input.text();
      const citations = parseMarcxml(text);
      if (citations.length === 0) throw new Error("No records found in the MARCXML file");
      const csv = await citationsToCsv(citations);
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MARCXML to XLSX",
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

export default marcxmlToXlsx;
