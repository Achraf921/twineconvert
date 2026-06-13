import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { buildBibtex } from "../util/bibtex";

/**
 * Reference list (plain text) → BibTeX. Parses a pasted bibliography
 * (numbered IEEE or APA style) into citations and emits BibTeX entries
 * for LaTeX / Overleaf workflows. Driven by the same PostHog signal as
 * references-to-ris: users pasting a paper's References section.
 */
const referencesToBibtex: Converter = {
  id: "references-to-bibtex",
  label: "Reference List → BibTeX",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bib: string;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No references recognized. This tool reads a plain-text reference list (numbered IEEE entries like [1] Author, \"Title,\" 2024, or APA entries like Author (2020). Title.). Make sure each reference has a title and year.",
        );
      }
      bib = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references to BibTeX",
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

export default referencesToBibtex;
