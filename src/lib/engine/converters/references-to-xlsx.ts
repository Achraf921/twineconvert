import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { citationsToCsv } from "../util/citations-to-csv";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * Reference list (plain text) → XLSX. Parses a pasted bibliography
 * (numbered IEEE or APA entries) and writes an Excel workbook with one
 * row per reference. The systematic-review workflow: paste a paper's
 * reference section, screen it in Excel.
 */
const referencesToXlsx: Converter = {
  id: "references-to-xlsx",
  label: "Reference List → XLSX",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No references recognized. This tool reads a plain-text reference list (numbered IEEE entries like [1] Author, \"Title,\" 2024, or APA entries like Author (2020). Title.). Make sure each reference has a title and year.",
        );
      }
      const csv = await citationsToCsv(citations);
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default referencesToXlsx;
