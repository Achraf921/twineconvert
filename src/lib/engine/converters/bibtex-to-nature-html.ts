import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { renderCitationStyleHtml } from "../util/csl-render";

/**
 * BibTeX -> Nature (HTML). Parses BibTeX into the unified Citation model, then
 * renders a formatted Nature reference list as a self-contained HTML document,
 * ready to paste into Word, Google Docs or a web page with formatting intact.
 * The plain-text Nature tool is the companion for copy-paste-anywhere output.
 */
const bibtexToNatureHtml: Converter = {
  id: "bibtex-to-nature-html",
  label: "BibTeX -> Nature (HTML)",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "text/html",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseBibtex(await input.text());
      if (citations.length === 0) throw new Error("No references found in the BibTeX file");
      out = await renderCitationStyleHtml(citations, "nature");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render the Nature HTML bibliography",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default bibtexToNatureHtml;
