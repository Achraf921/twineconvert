import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { rtfToHtml } from "../util/rtf";

const rtfToHtmlConverter: Converter = {
  id: "rtf-to-html",
  label: "RTF → HTML",
  fromMime: ["application/rtf", "text/rtf", "text/plain"],
  accept: [".rtf"],
  toMime: "text/html",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const raw = await input.text();
      if (!raw.trimStart().startsWith("{\\rtf")) {
        throw new Error("Not an RTF file (missing {\\rtf header)");
      }
      html = rtfToHtml(raw);
      if (!/<p>/.test(html)) throw new Error("RTF contained no extractable text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RTF to HTML",
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

export default rtfToHtmlConverter;
