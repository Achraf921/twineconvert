import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEml, type ParsedEmail } from "../util/email-parse";
import { renderTextPdf, htmlToPlainText, type PdfTextSection } from "../util/jspdf-text";

/**
 * EML → PDF. Renders headers (From/To/Subject/Date) as a styled block
 * at the top, then the email body. HTML body is preferred when the
 * source has both HTML and text parts; falls back to text otherwise.
 *
 * Attachments are NOT embedded in the PDF in v1, that would mean
 * reconstructing a multi-page PDF where each attachment renders on its
 * own page. For now we list filenames at the bottom so users know
 * what's missing. Future: add a "with attachments" route that produces
 * a ZIP of (PDF + attached files) instead.
 */
const emlToPdf: Converter = {
  id: "eml-to-pdf",
  label: "EML → PDF",
  fromMime: ["message/rfc822", "text/plain"],
  accept: [".eml"],
  toMime: "application/pdf",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const text = await input.text();
      const email = await parseEml(text);
      blob = await renderTextPdf(buildEmailSections(email), {
        title: email.subject || "(no subject)",
      });
      opts?.onProgress?.(0.95);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render email as PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

function buildEmailSections(email: ParsedEmail): PdfTextSection[] {
  const meta: string[] = [];
  if (email.from) meta.push(`From: ${email.from}`);
  if (email.to) meta.push(`To: ${email.to}`);
  if (email.cc) meta.push(`Cc: ${email.cc}`);
  if (email.date) meta.push(`Date: ${email.date}`);

  const body = email.textBody?.trim() ||
    (email.htmlBody ? htmlToPlainText(email.htmlBody) : "(no message body)");

  const sections: PdfTextSection[] = [{ meta, body }];

  if (email.attachments.length > 0) {
    sections.push({
      heading: `Attachments (${email.attachments.length})`,
      body: email.attachments.map((a) => `- ${a.filename}`).join("\n"),
    });
  }

  return sections;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export function renderEmailHtml(email: ParsedEmail): string {
  const headerRows: string[] = [];
  const addRow = (label: string, value?: string) => {
    if (value) headerRows.push(`<tr><td style="font-weight:600;color:#555;padding:2px 8px 2px 0;">${label}</td><td>${escapeHtml(value)}</td></tr>`);
  };
  addRow("From", email.from);
  addRow("To", email.to);
  addRow("Cc", email.cc);
  addRow("Date", email.date);
  addRow("Subject", email.subject);

  // Use the HTML body when present; otherwise fall back to text wrapped in <pre>.
  const body = email.htmlBody
    ? email.htmlBody
    : email.textBody
    ? `<pre style="font-family: ui-monospace, monospace; white-space: pre-wrap; font-size: 12px;">${escapeHtml(email.textBody)}</pre>`
    : `<p style="color:#999;font-style:italic;">(no message body)</p>`;

  const attachmentsList = email.attachments.length
    ? `<hr><p style="font-size:11px;color:#555;"><strong>Attachments (${email.attachments.length}):</strong> ${email.attachments.map((a) => escapeHtml(a.filename)).join(", ")}</p>`
    : "";

  return `<table style="border-collapse:collapse;font-size:12px;margin-bottom:12px;">${headerRows.join("")}</table><hr style="margin:12px 0;">${body}${attachmentsList}`;
}

export default emlToPdf;
