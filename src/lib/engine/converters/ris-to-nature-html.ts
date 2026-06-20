import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { renderCitationStyleHtml } from "../util/csl-render";

/**
 * RIS -> Nature (HTML). Parses RIS into the unified Citation model, then
 * renders a formatted Nature reference list as a self-contained HTML document,
 * ready to paste into Word, Google Docs or a web page with formatting intact.
 * The plain-text Nature tool is the companion for copy-paste-anywhere output.
 */
const risToNatureHtml: Converter = {
  id: "ris-to-nature-html",
  label: "RIS -> Nature (HTML)",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "text/html",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No references found in the RIS file");
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

export default risToNatureHtml;
