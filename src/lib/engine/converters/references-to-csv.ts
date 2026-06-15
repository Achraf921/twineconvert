import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { citationsToCsv } from "../util/citations-to-csv";

/**
 * Reference list (plain text) → CSV. Parses a pasted bibliography
 * (numbered IEEE or APA entries) into a spreadsheet-friendly CSV (title,
 * authors, year, journal, doi ...). Useful for building a systematic-
 * review screening sheet from a paper's reference section.
 */
const referencesToCsv: Converter = {
  id: "references-to-csv",
  label: "Reference List → CSV",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/csv",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No references recognized. This tool reads a plain-text reference list (numbered IEEE entries like [1] Author, \"Title,\" 2024, or APA entries like Author (2020). Title.). Make sure each reference has a title and year.",
        );
      }
      csv = await citationsToCsv(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references to CSV",
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

export default referencesToCsv;
