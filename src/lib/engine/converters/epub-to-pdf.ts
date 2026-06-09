import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractEpub } from "../util/epub-extract";
import { renderTextPdf, htmlToPlainText, type PdfTextSection } from "../util/jspdf-text";

/**
 * EPUB → SEARCHABLE PDF. Each chapter becomes a section with the
 * chapter title as heading and the prose as body. Real text in the
 * PDF means the result is grep-friendly and screen-reader friendly.
 *
 * Image resources embedded in the EPUB are NOT inlined; the PDF is
 * text-only. Customers who want fully visual fidelity should use a
 * dedicated EPUB reader's print-to-PDF feature.
 */
const epubToPdf: Converter = {
  id: "epub-to-pdf",
  label: "EPUB → PDF",
  fromMime: ["application/epub+zip"],
  toMime: "application/pdf",
  accept: [".epub"],
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const extracted = await extractEpub(input);
      const sections: PdfTextSection[] = extracted.chaptersHtml.map((chapter, i) => {
        const m = chapter.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const inner = m ? m[1] : chapter;
        const text = htmlToPlainText(inner);
        return {
          heading: `Chapter ${i + 1}`,
          body: text || "(empty chapter)",
        };
      });
      blob = await renderTextPdf(sections, { title: extracted.title });
      opts?.onProgress?.(0.95);
    } catch (err) {
      throw new ConvertFailedError("PDF render from EPUB failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

export default epubToPdf;
