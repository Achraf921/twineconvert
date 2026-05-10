import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseDiscordExport, type DiscordMessage } from "../util/discord-chat";

/**
 * DiscordChatExporter JSON → clean Markdown for archival.
 * Each message becomes a blockquote header (author + timestamp) followed
 * by the content. Attachments are listed as inline links.
 */
const discordChatToMd: Converter = {
  id: "discord-chat-to-md",
  label: "Discord Chat → Markdown",
  fromMime: ["application/json"],
  accept: [".json"],
  toMime: "text/markdown",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let md: string;
    try {
      const parsed = parseDiscordExport(await input.text());
      md = renderMarkdown(parsed.guildName, parsed.channelName, parsed.messages);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse Discord export",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([md], { type: "text/markdown;charset=utf-8" }),
      filename: swapExtension(input.name, "md"),
    };
  },
};

function renderMarkdown(guild: string | undefined, channel: string | undefined, messages: DiscordMessage[]): string {
  const lines: string[] = [];
  lines.push(`# Discord Chat: ${guild ? `${guild} → ` : ""}#${channel ?? "channel"}`);
  lines.push("");
  lines.push(`*${messages.length} message${messages.length === 1 ? "" : "s"}*`);
  lines.push("");

  let lastDate: string | null = null;
  for (const m of messages) {
    const date = m.timestamp.slice(0, 10);
    if (date !== lastDate) {
      lines.push("");
      lines.push(`---`);
      lines.push(`### ${date}`);
      lines.push("");
      lastDate = date;
    }
    const time = m.timestamp.slice(11, 16);
    lines.push(`**${m.author}** *, ${time}${m.isEdited ? " (edited)" : ""}*`);
    if (m.content) {
      // Indent content as a blockquote so multi-line messages stay grouped.
      lines.push(...m.content.split("\n").map((l) => `> ${l}`));
    }
    if (m.attachmentUrls.length > 0) {
      lines.push("");
      for (const url of m.attachmentUrls) {
        lines.push(`📎 [attachment](${url})`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

export default discordChatToMd;
