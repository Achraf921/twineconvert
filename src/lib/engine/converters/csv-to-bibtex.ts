import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildBibtex } from "../util/bibtex";
import { citationsFromCsv } from "../util/citation-csv";

const csvToBibtex: Converter = {
  id: "csv-to-bibtex",
  label: "CSV → BibTeX",
  fromMime: ["text/csv", "application/csv"],
  accept: [".csv"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bibtex: string;
    try {
      const citations = await citationsFromCsv(await input.text());
      if (citations.length === 0) throw new Error("No citations found in CSV");
      bibtex = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to BibTeX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bibtex], { type: "application/x-bibtex" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default csvToBibtex;
