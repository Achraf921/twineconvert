import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildBibtex } from "../util/bibtex";
import { citationsFromCsv } from "../util/citation-csv";
import { citationInputHint } from "../util/citation-input-hint";

const csvToBibtex: Converter = {
  id: "csv-to-bibtex",
  label: "CSV → BibTeX",
  fromMime: ["text/csv", "application/csv"],
  accept: [".csv"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const text = await input.text();
    let citations;
    try {
      citations = await citationsFromCsv(text);
    } catch (err) {
      const hint = citationInputHint(text, "references-to-bibtex", "pubmed-to-bibtex");
      throw new ConvertFailedError(
        hint ?? (err instanceof Error ? err.message : "Could not convert CSV to BibTeX"),
        err,
      );
    }
    if (citations.length === 0) {
      const hint = citationInputHint(text, "references-to-bibtex", "pubmed-to-bibtex");
      throw new ConvertFailedError(hint ?? "No citations found in CSV");
    }
    const bibtex = buildBibtex(citations);
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bibtex], { type: "application/x-bibtex" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default csvToBibtex;
