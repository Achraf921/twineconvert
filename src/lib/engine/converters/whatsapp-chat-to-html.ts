import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseWhatsapp, type WhatsappMessage } from "../util/whatsapp-parse";

/**
 * WhatsApp Chat → HTML. Produces a self-contained chat-bubble layout
 * styled to read like the WhatsApp UI itself: green outgoing bubbles
 * on the right, white incoming bubbles on the left, sender names above
 * each message group, system events centered.
 *
 * The "outgoing" sender heuristic: WhatsApp doesn't tell us in the
 * export which sender was you. We pick the first sender alphabetically
 * as "incoming" (left) and treat any other sender as "outgoing" (right) ,
 * this is a coin flip but at least produces the visual two-sided layout
 * users recognize. Future: let the user pick their name in the UI.
 */
const whatsappChatToHtml: Converter = {
  id: "whatsapp-chat-to-html",
  label: "WhatsApp Chat → HTML",
  fromMime: ["text/plain", "application/zip"],
  accept: [".txt", ".zip"],
  toMime: "text/html",
  maxFileSizeBytes: 4 * 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const parsed = await parseWhatsapp(input);
      html = renderHtml(parsed.messages, parsed.participantCounts);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse WhatsApp chat",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([html], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name.replace(/\.zip$/i, ".txt"), "html"),
    };
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function pickIncomingSender(participantCounts: Record<string, number>): string | undefined {
  return Object.keys(participantCounts).sort()[0];
}

function renderHtml(messages: WhatsappMessage[], participantCounts: Record<string, number>): string {
  const incoming = pickIncomingSender(participantCounts);
  const bubbles: string[] = [];
  let lastSender: string | undefined = undefined;

  for (const msg of messages) {
    if (msg.isSystem) {
      bubbles.push(`<div class="sys">${escapeHtml(msg.text)}</div>`);
      lastSender = undefined;
      continue;
    }
    const isIncoming = msg.sender === incoming;
    const showName = msg.sender !== lastSender;
    bubbles.push(`<div class="row ${isIncoming ? "in" : "out"}">
  <div class="bubble">
    ${showName ? `<div class="sender">${escapeHtml(msg.sender ?? "")}</div>` : ""}
    <div class="text">${escapeHtml(msg.text).replace(/\n/g, "<br>")}</div>
    <div class="ts">${escapeHtml(msg.timestamp)}</div>
  </div>
</div>`);
    lastSender = msg.sender;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WhatsApp Chat Export</title>
<style>
  body { background: #e5ddd5; margin: 0; font-family: -apple-system, system-ui, "Segoe UI", Helvetica, sans-serif; }
  .container { max-width: 700px; margin: 0 auto; padding: 1rem; }
  .row { display: flex; margin: 0.25rem 0; }
  .row.in { justify-content: flex-start; }
  .row.out { justify-content: flex-end; }
  .bubble { max-width: 75%; padding: 0.5rem 0.75rem; border-radius: 8px; box-shadow: 0 1px 0.5px rgba(0,0,0,.13); position: relative; }
  .row.in .bubble { background: #fff; }
  .row.out .bubble { background: #dcf8c6; }
  .sender { font-size: 0.75rem; font-weight: 600; color: #4f9e9e; margin-bottom: 0.15rem; }
  .text { font-size: 0.95rem; color: #303030; line-height: 1.35; }
  .ts { font-size: 0.65rem; color: #999; text-align: right; margin-top: 0.25rem; }
  .sys { text-align: center; color: #555; font-size: 0.8rem; background: #fcf4cb; max-width: 80%; margin: 0.5rem auto; padding: 0.35rem 0.75rem; border-radius: 6px; }
</style>
</head>
<body>
<div class="container">
${bubbles.join("\n")}
</div>
</body>
</html>`;
}

export default whatsappChatToHtml;
