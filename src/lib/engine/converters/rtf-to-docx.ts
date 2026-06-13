import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import rtfToHtml from "./rtf-to-html";
import htmlToDocx from "./html-to-docx";

/**
 * RTF → DOCX. Extracts the RTF's text and structure to HTML, then maps
 * each block to a Word paragraph via the html-to-docx pipeline. Headings,
 * paragraphs, and bold/italic runs survive; RTF tables and embedded
 * objects flatten to plain paragraphs, matching html-to-docx fidelity.
 */
const rtfToDocx: Converter = {
  id: "rtf-to-docx",
  label: "RTF → DOCX",
  fromMime: ["application/rtf", "text/rtf", "text/plain"],
  accept: [".rtf"],
  toMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const html = await rtfToHtml.convert(input, undefined);
      const htmlFile = new File([await html.blob.text()], swapExtension(input.name, "html"), {
        type: "text/html",
      }) as unknown as File;
      opts?.onProgress?.(0.5);
      const docx = await htmlToDocx.convert(htmlFile, undefined);
      blob = docx.blob;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RTF to DOCX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "docx") };
  },
};

export default rtfToDocx;
