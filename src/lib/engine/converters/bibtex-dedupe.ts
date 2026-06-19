import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex, buildBibtex } from "../util/bibtex";
import { dedupeCitations } from "../util/citation-dedupe";

/**
 * BibTeX de-duplicate. Parses a BibTeX library, removes duplicate
 * references (same DOI, or same title + year when there is no DOI), and
 * writes BibTeX back. Useful after merging exports from several databases
 * (PubMed, Scopus, Web of Science) that return the same papers.
 */
const bibtexDedupe: Converter = {
  id: "bibtex-dedupe",
  label: "BibTeX Deduplicate",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseBibtex(await input.text());
      if (citations.length === 0) throw new Error("No references found in the BibTeX file");
      const { citations: deduped } = dedupeCitations(citations);
      out = buildBibtex(deduped);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not deduplicate the BibTeX file",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-bibtex;charset=utf-8" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default bibtexDedupe;
