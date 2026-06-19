import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { citationInputHint } from "../util/citation-input-hint";
import { renderCitationStyle } from "../util/csl-render";

/**
 * CSV → AMA. Reads a spreadsheet of references (alias-aware headers), then
 * renders a formatted AMA (American Medical Association) reference list with
 * citeproc-js and the official AMA CSL style.
 */
const csvToAma: Converter = {
  id: "csv-to-ama",
  label: "CSV → AMA",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const text = await input.text();
    let out: string;
    try {
      const citations = await citationsFromCsv(text);
      if (citations.length === 0) throw new Error("No references found in the CSV file");
      out = await renderCitationStyle(citations, "ama", "text");
    } catch (err) {
      const hint = citationInputHint(text, "references-to-ris", "pubmed-to-ris");
      throw new ConvertFailedError(
        hint ?? (err instanceof Error ? err.message : "Could not convert CSV to AMA"),
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default csvToAma;
