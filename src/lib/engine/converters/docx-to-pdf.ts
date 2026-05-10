import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { renderTextPdf, htmlToPlainText, type PdfTextSection } from "../util/jspdf-text";

/**
 * DOCX → PDF. Pipeline: mammoth converts DOCX to semantic HTML, we
 * strip to plain text and render via jsPDF's text APIs to produce a
 * SEARCHABLE PDF.
 *
 * Fidelity trade-off: exact fonts, tables, and embedded objects don't
 * round-trip. Plain prose, lists, and headings do. Users who need
 * perfect fidelity will Print → Save as PDF from Word; our value
 * prop is "no Word required, no upload, no signup."
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
    let plain: string;
    try {
      const mammoth = (await import("mammoth")).default;
      const arrayBuffer = await input.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer, buffer: arrayBuffer } as Parameters<typeof mammoth.convertToHtml>[0]);
      plain = htmlToPlainText(result.value);
    } catch (err) {
      throw new ConvertFailedError(
        "Could not parse DOCX, file may be corrupt or password-protected",
        err,
      );
    }
    opts?.onProgress?.(0.6);

    let blob: Blob;
    try {
      const sections: PdfTextSection[] = [{ body: plain || "(empty document)" }];
      blob = await renderTextPdf(sections);
    } catch (err) {
      throw new ConvertFailedError("PDF render from DOCX failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

export default docxToPdf;
