import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseWos } from "../util/wos";
import { buildHtmlBibliography } from "../util/bibliography-render";

/**
 * Web of Science → HTML. Parses the Web of Science / ISI tagged export into the
 * unified Citation model, then writes HTML. The
 * format VOSviewer, bibliometrix, and CiteSpace read; import-only.
 */
const wosToHtml: Converter = {
  id: "wos-to-html",
  label: "Web of Science → HTML",
  fromMime: ["text/plain", "application/x-inst-for-scientific-info"],
  accept: [".txt", ".ciw", ".isi"],
  toMime: "text/html",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseWos(text);
      if (citations.length === 0) throw new Error("No references found in the Web of Science file");
      out = buildHtmlBibliography(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Web of Science to HTML",
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

export default wosToHtml;
