import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { htmlToPdf } from "../util/jspdf-html";

/**
 * Markdown → PDF. Two-step pipeline: render Markdown to HTML via
 * marked, then rasterize the HTML to a PDF page via the existing
 * jspdf-html util. Layout is the simple typographic style other
 * "X-to-PDF" converters in this codebase use (Letter page, ~1in
 * margins, 11pt body).
 */
const markdownToPdf: Converter = {
  id: "markdown-to-pdf",
  label: "Markdown → PDF",
  fromMime: ["text/markdown", "text/x-markdown", "text/plain"],
  accept: [".md", ".markdown"],
  toMime: "application/pdf",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let pdfBlob: Blob;
    try {
      const { marked } = await import("marked");
      const body = await marked.parse(await input.text(), {
        async: true,
        breaks: false,
        gfm: true,
      });
      opts?.onProgress?.(0.5);
      pdfBlob = await htmlToPdf(body, { onProgress: opts?.onProgress });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render Markdown to PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: pdfBlob,
      filename: swapExtension(input.name, "pdf"),
    };
  },
};

export default markdownToPdf;
