import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractEpub } from "../util/epub-extract";
import { htmlToPdf } from "../util/jspdf-html";

/**
 * EPUB → PDF. Pipeline: extract chapter HTMLs, concatenate with page
 * breaks, render to PDF via jsPDF.html(). Image resources embedded in the
 * EPUB are NOT inlined, the PDF will show broken-image placeholders for
 * any chapters that reference them. Full image embedding requires reading
 * each <img> from the zip and converting to data: URLs; left as a v2
 * improvement when we have signal that users care.
 */
const epubToPdf: Converter = {
  id: "epub-to-pdf",
  label: "EPUB → PDF",
  fromMime: ["application/epub+zip"],
  toMime: "application/pdf",
  accept: [".epub"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let html: string;
    try {
      const extracted = await extractEpub(input);
      const inner = extracted.chaptersHtml
        .map((chapter) => {
          const m = chapter.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          return m ? m[1] : chapter;
        })
        .join('\n<div style="page-break-after: always;"></div>\n');
      html = `<h1>${extracted.title}</h1>${inner}`;
    } catch (err) {
      throw new ConvertFailedError("Could not parse EPUB", err);
    }
    opts?.onProgress?.(0.2);

    let blob: Blob;
    try {
      blob = await htmlToPdf(html, {
        onProgress: (p) => opts?.onProgress?.(0.2 + p * 0.75),
      });
    } catch (err) {
      throw new ConvertFailedError("PDF render from EPUB failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

export default epubToPdf;
