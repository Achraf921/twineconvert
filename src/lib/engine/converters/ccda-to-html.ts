import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ccdaToHtml, parseCcda } from "../util/ccda";

const ccdaToHtmlConverter: Converter = {
  id: "ccda-to-html",
  label: "C-CDA → HTML",
  fromMime: ["application/cda+xml", "application/xml", "text/xml"],
  accept: [".xml", ".cda", ".ccda"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const doc = parseCcda(await input.text());
      html = ccdaToHtml(doc);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert C-CDA to HTML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([html], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default ccdaToHtmlConverter;
