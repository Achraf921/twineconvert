import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { loadPdfjs } from "../util/pdf-render";

/**
 * PDF → DOCX. Best-effort text extraction with paragraph reconstruction ,
 * matches the volume of "I just need the text editable" intent without
 * pretending to preserve layout fidelity (no tables, no images, no
 * columns, no fonts).
 *
 * Implementation:
 *   1. pdfjs extracts text with per-item positions
 *   2. We group items by Y coordinate into paragraphs (within ~5px)
 *   3. Each page becomes a section, each paragraph a separate Paragraph
 *      in the docx
 *
 * For "PDF with real layout fidelity" users we surface a clear note in
 * the UI elsewhere directing them to Adobe/iLovePDF, that's a fight we
 * structurally can't win client-side. This route serves the much larger
 * "give me the text in Word so I can edit" use case.
 */
const pdfToDocx: Converter = {
  id: "pdf-to-docx",
  label: "PDF → DOCX",
  fromMime: ["application/pdf"],
  accept: [".pdf"],
  toMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const pdfjs = await loadPdfjs();
      const docxLib = await import("docx");
      const { Document, Packer, Paragraph, TextRun, PageBreak } = docxLib;

      const arrayBuffer = await input.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const sections: InstanceType<typeof Paragraph>[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Group items by approximate Y position to reconstruct lines.
        // pdfjs gives us text positioned in PDF coords (Y grows upward).
        type Line = { y: number; items: string[] };
        const lines: Line[] = [];
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const y = (item as { transform: number[] }).transform[5];
          const existing = lines.find((l) => Math.abs(l.y - y) < 3);
          if (existing) existing.items.push(item.str);
          else lines.push({ y, items: [item.str] });
        }
        // Sort lines top-to-bottom (descending Y) and emit each as a Paragraph.
        lines.sort((a, b) => b.y - a.y);
        for (const line of lines) {
          const text = line.items.join(" ").replace(/\s+/g, " ").trim();
          if (!text) continue;
          sections.push(new Paragraph({ children: [new TextRun(text)] }));
        }
        if (i < pdf.numPages) {
          sections.push(new Paragraph({ children: [new PageBreak()] }));
        }
        opts?.onProgress?.(0.1 + (i / pdf.numPages) * 0.7);
        await page.cleanup();
      }
      await pdf.destroy();

      const doc = new Document({ sections: [{ children: sections }] });
      const out = await Packer.toBlob(doc);
      blob = out;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PDF to DOCX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob,
      filename: swapExtension(input.name, "docx"),
    };
  },
};

export default pdfToDocx;
