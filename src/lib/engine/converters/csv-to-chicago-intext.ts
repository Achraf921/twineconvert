import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { citationInputHint } from "../util/citation-input-hint";
import { renderInTextCitations } from "../util/csl-render";

/**
 * CSV → Chicago in-text citations. Reads a spreadsheet of references
 * (alias-aware headers), then renders the Chicago in-text citation for each
 * row, tab-paired with the source title.
 */
const csvToChicagoIntext: Converter = {
  id: "csv-to-chicago-intext",
  label: "CSV → Chicago In-Text Citations",
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
      const inText = await renderInTextCitations(citations, "chicago");
      out = citations.map((c, i) => inText[i] + "\t" + (c.title || c.authors?.[0] || "Untitled reference").trim()).join("\n") + "\n";
    } catch (err) {
      const hint = citationInputHint(text, "references-to-ris", "pubmed-to-ris");
      throw new ConvertFailedError(hint ?? (err instanceof Error ? err.message : "Could not generate Chicago in-text citations"), err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "txt") };
  },
};

export default csvToChicagoIntext;
