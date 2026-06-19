import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { renderCitationStyle } from "../util/csl-render";

/**
 * BibTeX → APA. Parses BibTeX into the unified Citation model, then
 * renders a formatted APA (7th edition) reference list with citeproc-js
 * and the official APA CSL style, so the output matches what Zotero or
 * Mendeley would produce. Plain text, one reference per paragraph.
 */
const bibtexToApa: Converter = {
  id: "bibtex-to-apa",
  label: "BibTeX → APA",
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
      out = await renderCitationStyle(citations, "apa", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert BibTeX to APA",
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

export default bibtexToApa;
