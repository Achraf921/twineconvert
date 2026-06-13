import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildBibtex } from "../util/bibtex";

/**
 * PubMed export (.txt / .nbib) → BibTeX. Parses PubMed's MEDLINE-tagged
 * download (PMID-/TI-/AU- ...) and emits BibTeX for LaTeX / Overleaf.
 * Same PostHog-driven need as pubmed-to-ris: researchers exporting from
 * PubMed want their citations in a usable bibliography format.
 */
const pubmedToBibtex: Converter = {
  id: "pubmed-to-bibtex",
  label: "PubMed → BibTeX",
  fromMime: ["text/plain", "application/x-research-info-systems"],
  accept: [".txt", ".nbib"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bib: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No PubMed records found. This tool reads a PubMed/MEDLINE export (Save → Format: PubMed, or a .nbib file) with PMID-/TI-/AU- tagged lines.",
        );
      }
      bib = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PubMed export to BibTeX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bib], { type: "application/x-bibtex" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default pubmedToBibtex;
