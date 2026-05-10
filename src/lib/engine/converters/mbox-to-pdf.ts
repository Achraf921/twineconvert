import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMbox } from "../util/email-parse";
import { htmlToPdf } from "../util/jspdf-html";
import { renderEmailHtml } from "./eml-to-pdf";

/**
 * MBOX → PDF. Renders every message in the mbox as a stacked PDF
 * with page breaks between. The SERP for this is dominated by paid
 * desktop installers (RecoveryTools, BitRecover), a free in-browser
 * tool is genuinely missing from page one.
 */
const mboxToPdf: Converter = {
  id: "mbox-to-pdf",
  label: "MBOX → PDF",
  fromMime: ["application/mbox", "text/plain"],
  accept: [".mbox"],
  toMime: "application/pdf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const text = await input.text();
      const emails = await parseMbox(text);
      if (emails.length === 0) throw new Error("MBOX contained no parseable messages");
      const sections = emails
        .map((e) => renderEmailHtml(e))
        .join('\n<div style="page-break-after: always;"></div>\n');
      blob = await htmlToPdf(sections, {
        onProgress: (p) => opts?.onProgress?.(0.1 + p * 0.85),
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render MBOX as PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

export default mboxToPdf;
