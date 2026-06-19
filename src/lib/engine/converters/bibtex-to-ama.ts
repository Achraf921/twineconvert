import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { renderCitationStyle } from "../util/csl-render";

/**
 * BibTeX → AMA. Parses BibTeX into the unified Citation model, then renders a
 * formatted AMA (American Medical Association, 11th edition) reference list with citeproc-js and the official AMA
 * CSL style, matching what Zotero or Mendeley produce. Plain text.
 */
const bibtexToAma: Converter = {
  id: "bibtex-to-ama",
  label: "BibTeX → AMA",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseBibtex(await input.text());
      if (citations.length === 0) throw new Error("No references found in the BibTeX file");
      out = await renderCitationStyle(citations, "ama", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert BibTeX to AMA",
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

export default bibtexToAma;
