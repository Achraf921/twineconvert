import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMsg, type ParsedMsg } from "../util/msg";
import { htmlToPlainText, renderTextPdf, type PdfTextSection } from "../util/jspdf-text";

/**
 * MSG → PDF. Renders the Outlook message headers (From/To/Subject/Date)
 * and body as a clean PDF, mirroring our eml-to-pdf shape so the
 * output is consistent across email sources.
 *
 * Attachments are listed by filename at the bottom rather than
 * embedded; a binary attachment cannot be flattened into the visual
 * PDF and an attachment-aware route is a separate shape.
 */
const msgToPdf: Converter = {
  id: "msg-to-pdf",
  label: "MSG → PDF",
  fromMime: ["application/vnd.ms-outlook", "application/x-msg", "application/octet-stream"],
  accept: [".msg"],
  toMime: "application/pdf",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const msg = await parseMsg(await input.arrayBuffer());
      if (!msg.subject && !msg.from && !msg.body && !msg.htmlBody) {
        throw new Error(
          "MSG had no readable subject, sender, or body.",
        );
      }
      blob = await renderTextPdf(buildSections(msg), {
        title: msg.subject || "(no subject)",
      });
      opts?.onProgress?.(0.95);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render MSG as PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

function buildSections(msg: ParsedMsg): PdfTextSection[] {
  const meta: string[] = [];
  if (msg.from) meta.push(`From: ${msg.from}`);
  if (msg.to) meta.push(`To: ${msg.to}`);
  if (msg.cc) meta.push(`Cc: ${msg.cc}`);
  if (msg.date) meta.push(`Date: ${msg.date}`);

  const body =
    msg.body?.trim() ||
    (msg.htmlBody ? htmlToPlainText(msg.htmlBody) : "(no message body)");

  const sections: PdfTextSection[] = [{ meta, body }];
  if (msg.attachments.length > 0) {
    sections.push({
      heading: `Attachments (${msg.attachments.length})`,
      body: msg.attachments.map((a) => `- ${a.filename}`).join("\n"),
    });
  }
  return sections;
}

export default msgToPdf;
