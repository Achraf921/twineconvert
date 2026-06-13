import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildHtmlBibliography } from "../util/bibliography-render";

/**
 * RIS → a formatted HTML reference list. Parses RIS into the unified Citation model, then renders each entry as a human-readable HTML bibliography.
 */
const risToHtml: Converter = {
  id: "ris-to-html",
  label: "RIS → HTML",
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
      out = buildHtmlBibliography(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to HTML",
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

export default risToHtml;
