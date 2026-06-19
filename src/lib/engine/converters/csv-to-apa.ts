import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { citationInputHint } from "../util/citation-input-hint";
import { renderCitationStyle } from "../util/csl-render";

/**
 * CSV → APA. Reads a spreadsheet of references (alias-aware headers, so
 * Scopus/Zotero/PubMed CSV exports work without renaming columns), then
 * renders a formatted APA (7th edition) reference list with citeproc-js and the
 * official APA CSL style. Plain text, one reference per paragraph.
 */
const csvToApa: Converter = {
  id: "csv-to-apa",
  label: "CSV → APA",
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
      out = await renderCitationStyle(citations, "apa", "text");
    } catch (err) {
      const hint = citationInputHint(text, "references-to-ris", "pubmed-to-ris");
      throw new ConvertFailedError(
        hint ?? (err instanceof Error ? err.message : "Could not convert CSV to APA"),
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

export default csvToApa;
