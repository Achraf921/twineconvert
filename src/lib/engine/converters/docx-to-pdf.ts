import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { htmlToPdf } from "../util/jspdf-html";

/**
 * DOCX → PDF. Pipeline: mammoth converts DOCX to semantic HTML, then
 * jsPDF (with html2canvas) rasterizes that HTML to a PDF.
 *
 * Fidelity is "good enough for sharing/printing" — exact font metrics,
 * complex tables, and embedded objects may not render identically.
 * Users who need perfect fidelity will Print → Save as PDF in Word.
 * Our value prop is "no Word required, no upload, no signup."
 */
const docxToPdf: Converter = {
  id: "docx-to-pdf",
  label: "DOCX → PDF",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  toMime: "application/pdf",
  accept: [".docx"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let html: string;
    try {
      const mammoth = (await import("mammoth")).default;
      const arrayBuffer = await input.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer, buffer: arrayBuffer } as Parameters<typeof mammoth.convertToHtml>[0]);
      html = result.value;
    } catch (err) {
      throw new ConvertFailedError(
        "Could not parse DOCX — file may be corrupt or password-protected",
        err,
      );
    }
    opts?.onProgress?.(0.3);

    let blob: Blob;
    try {
      blob = await htmlToPdf(html, {
        onProgress: (p) => opts?.onProgress?.(0.3 + p * 0.65),
      });
    } catch (err) {
      throw new ConvertFailedError("PDF render from DOCX failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

export default docxToPdf;
