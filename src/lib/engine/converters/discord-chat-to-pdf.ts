import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { htmlToPdf } from "../util/jspdf-html";
import { parseDiscordExport, type DiscordMessage } from "../util/discord-chat";

/**
 * DiscordChatExporter JSON → PDF. Print-friendly transcript layout
 * for moderation, OSINT investigations, and legal evidence collection.
 */
const discordChatToPdf: Converter = {
  id: "discord-chat-to-pdf",
  label: "Discord Chat → PDF",
  fromMime: ["application/json"],
  accept: [".json"],
  toMime: "application/pdf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const parsed = parseDiscordExport(await input.text());
      const html = renderPdfHtml(parsed.guildName, parsed.channelName, parsed.messages);
      blob = await htmlToPdf(html, {
        onProgress: (p) => opts?.onProgress?.(0.1 + p * 0.85),
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render Discord chat as PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function renderPdfHtml(guild: string | undefined, channel: string | undefined, messages: DiscordMessage[]): string {
  const header = `<h1 style="font-size:18px;border-bottom:1px solid #333;padding-bottom:6px;">Discord Chat: ${guild ? escapeHtml(guild) + " → " : ""}#${escapeHtml(channel ?? "channel")}</h1><p style="font-size:11px;color:#777;">${messages.length} messages</p>`;
  const rows = messages
    .map((m) => {
      const ts = escapeHtml(m.timestamp);
      const author = escapeHtml(m.author);
      const content = escapeHtml(m.content).replace(/\n/g, "<br>");
      const attachments = m.attachmentUrls.length > 0
        ? `<div style="font-size:10px;color:#777;">📎 ${m.attachmentCount} attachment${m.attachmentCount === 1 ? "" : "s"}</div>`
        : "";
      return `<p style="margin:6px 0;font-size:12px;">
        <strong style="color:#5865F2;">${author}</strong>
        <span style="color:#999;font-size:10px;"> · ${ts}${m.isEdited ? " (edited)" : ""}</span><br>
        <span style="color:#222;">${content}</span>
        ${attachments}
      </p>`;
    })
    .join("");
  return header + rows;
}

export default discordChatToPdf;
