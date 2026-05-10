import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ocrImage, textToBlob } from "../util/tesseract-ocr";
import { loadPdfjs, renderPdfPage } from "../util/pdf-render";

/**
 * PDF → Text. Two paths depending on the PDF:
 *   1. Text-based PDFs (most office docs), pdf.js extracts the text layer
 *      directly (fast, accurate). Walks every page.
 *   2. Scanned-image PDFs (no text layer), falls back to rasterizing the
 *      first page and running Tesseract OCR. Multi-page OCR is intentionally
 *      out of scope here (slow + needs different UX).
 */
const pdfToText: Converter = {
  id: "pdf-to-text",
  label: "PDF → Text",
  fromMime: ["application/pdf"],
  toMime: "text/plain",
  accept: [".pdf"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);

    const pdfjs = await loadPdfjs();

    let text = "";
    let pageCount = 0;
    try {
      const arrayBuffer = await input.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      pageCount = pdf.numPages;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        text += pageText + "\n\n";
        opts?.onProgress?.(0.1 + (i / pdf.numPages) * 0.7);
        await page.cleanup();
      }
      await pdf.destroy();
    } catch (err) {
      throw new ConvertFailedError(
        "Could not read PDF, file may be corrupt or password-protected",
        err,
      );
    }

    if (text.trim().length < 10 && pageCount >= 1) {
      try {
        const { canvas } = await renderPdfPage(input, { pageNumber: 1, scale: 2 });
        text = await ocrImage(canvas, {
          onProgress: (p) => opts?.onProgress?.(0.8 + p * 0.15),
        });
      } catch (err) {
        throw new ConvertFailedError("OCR fallback for scanned PDF failed", err);
      }
    }

    opts?.onProgress?.(1);
    return {
      blob: textToBlob(text.trim()),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default pdfToText;
