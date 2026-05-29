import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { buildNbib } from "../util/ris";

/**
 * BibTeX → NBIB. NBIB (PubMed format) is structurally identical to RIS
 * with a slightly different tag dictionary; PubMed accepts straight RIS
 * with a .nbib extension. Most reference managers (Zotero, Mendeley)
 * use the .nbib extension as a synonym for "PubMed-flavored RIS."
 */
const bibtexToNbib: Converter = {
  id: "bibtex-to-nbib",
  label: "BibTeX → NBIB",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let nbib: string;
    try {
      const citations = parseBibtex(await input.text());
      if (citations.length === 0) throw new Error("No citations found in BibTeX");
      nbib = buildNbib(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert BibTeX to NBIB",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([nbib], { type: "application/x-research-info-systems" }),
      filename: swapExtension(input.name, "nbib"),
    };
  },
};

export default bibtexToNbib;
