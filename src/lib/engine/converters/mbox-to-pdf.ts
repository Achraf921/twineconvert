import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMbox } from "../util/email-parse";
import { renderTextPdf, htmlToPlainText, type PdfTextSection } from "../util/jspdf-text";

/**
 * MBOX → PDF. Renders every message in the mbox as a section in a
 * SEARCHABLE PDF (real text embedded, not bitmap). The SERP for this
 * is dominated by paid desktop installers (RecoveryTools, BitRecover),
 * a free in-browser tool is genuinely missing from page one.
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

      const sections: PdfTextSection[] = emails.map((email) => {
        const meta: string[] = [];
        if (email.from) meta.push(`From: ${email.from}`);
        if (email.to) meta.push(`To: ${email.to}`);
        if (email.date) meta.push(`Date: ${email.date}`);
        const body = email.textBody?.trim() ||
          (email.htmlBody ? htmlToPlainText(email.htmlBody) : "(no message body)");
        return {
          heading: email.subject || "(no subject)",
          meta,
          body,
        };
      });

      blob = await renderTextPdf(sections, { title: `Mailbox archive (${emails.length} messages)` });
      opts?.onProgress?.(0.95);
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
