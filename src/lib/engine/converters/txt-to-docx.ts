import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * TXT → DOCX. Each non-empty line becomes a Paragraph; blank lines
 * become spacing. Preserves the line structure most users expect when
 * pasting plain text into Word.
 */
const txtToDocx: Converter = {
  id: "txt-to-docx",
  label: "TXT → DOCX",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const docxLib = await import("docx");
      const { Document, Packer, Paragraph, TextRun } = docxLib;
      const text = await input.text();
      const paragraphs = text.split(/\r?\n/).map((line) =>
        new Paragraph({ children: [new TextRun(line)] }),
      );
      const doc = new Document({ sections: [{ children: paragraphs }] });
      blob = await Packer.toBlob(doc);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert TXT to DOCX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "docx") };
  },
};

export default txtToDocx;
