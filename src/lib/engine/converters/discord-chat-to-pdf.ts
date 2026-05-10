import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { renderTextPdf, type PdfTextSection } from "../util/jspdf-text";
import { parseDiscordExport } from "../util/discord-chat";

/**
 * DiscordChatExporter JSON → SEARCHABLE PDF. Print-friendly transcript
 * layout for moderation, OSINT investigations, and legal evidence
 * collection. Real text in the PDF (not bitmap) so investigators can
 * grep, quote, and run text analytics.
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
      const lines = parsed.messages.map((m) => {
        const editedTag = m.isEdited ? " (edited)" : "";
        const attachTag =
          m.attachmentCount > 0
            ? ` [${m.attachmentCount} attachment${m.attachmentCount === 1 ? "" : "s"}]`
            : "";
        return `[${m.timestamp}] ${m.author}${editedTag}: ${m.content}${attachTag}`;
      });
      const titleParts: string[] = ["Discord Chat"];
      if (parsed.guildName) titleParts.push(parsed.guildName);
      if (parsed.channelName) titleParts.push(`#${parsed.channelName}`);

      const sections: PdfTextSection[] = [
        {
          meta: [`${parsed.messages.length} messages`],
          body: lines.join("\n\n"),
        },
      ];
      blob = await renderTextPdf(sections, { title: titleParts.join(" — ") });
      opts?.onProgress?.(0.95);
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

export default discordChatToPdf;
