import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { htmlToPdf } from "../util/jspdf-html";
import { parseWhatsapp, type WhatsappMessage } from "../util/whatsapp-parse";

/**
 * WhatsApp Chat → PDF. The court-evidence / archival use case is the
 * money one — people need a stable, paginated, human-readable PDF that
 * preserves who-said-what-when. Layout is intentionally print-friendly
 * (no chat-bubble UI) so it's compact and grep-friendly inside any
 * PDF reader.
 */
const whatsappChatToPdf: Converter = {
  id: "whatsapp-chat-to-pdf",
  label: "WhatsApp Chat → PDF",
  fromMime: ["text/plain", "application/zip"],
  accept: [".txt", ".zip"],
  toMime: "application/pdf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const parsed = await parseWhatsapp(input);
      const html = renderPrintHtml(parsed.messages);
      blob = await htmlToPdf(html, {
        onProgress: (p) => opts?.onProgress?.(0.1 + p * 0.85),
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render WhatsApp chat as PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name.replace(/\.zip$/i, ".txt"), "pdf") };
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function renderPrintHtml(messages: WhatsappMessage[]): string {
  const rows = messages
    .map((m) => {
      if (m.isSystem) {
        return `<p style="color:#777;font-style:italic;margin:6px 0;font-size:11px;">${escapeHtml(m.text)}</p>`;
      }
      return `<p style="margin:4px 0;font-size:12px;">
        <strong style="color:#222;">${escapeHtml(m.sender ?? "")}</strong>
        <span style="color:#999;font-size:10px;"> · ${escapeHtml(m.timestamp)}</span><br>
        <span style="color:#333;">${escapeHtml(m.text).replace(/\n/g, "<br>")}</span>
      </p>`;
    })
    .join("");
  return `<h1 style="font-size:18px;border-bottom:1px solid #333;padding-bottom:6px;">WhatsApp Chat Transcript</h1><p style="font-size:11px;color:#777;">${messages.length} messages</p>${rows}`;
}

export default whatsappChatToPdf;
