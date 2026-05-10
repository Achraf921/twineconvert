/**
 * Parser for DiscordChatExporter (Tyrrrz/DiscordChatExporter) JSON exports.
 *
 * The JSON shape is well-documented:
 *   {
 *     "guild": { "id", "name", "iconUrl" },
 *     "channel": { "id", "name", "topic", "category", ... },
 *     "messages": [{
 *       "id", "type", "timestamp", "timestampEdited",
 *       "author": { "id", "name", "discriminator", "nickname", "color" },
 *       "content",
 *       "attachments": [{ "id", "url", "fileName" }],
 *       "embeds": [...],
 *       "reactions": [...],
 *       "mentions": [...]
 *     }],
 *     "messageCount": ...
 *   }
 *
 * We surface what most downstream uses care about: timestamp, author,
 * content, attachment count, reaction count.
 */

export interface DiscordMessage {
  id: string;
  timestamp: string;
  author: string;
  authorId?: string;
  content: string;
  attachmentCount: number;
  attachmentUrls: string[];
  reactionCount: number;
  isEdited: boolean;
  type?: string;
}

export interface ParsedDiscordExport {
  guildName?: string;
  channelName?: string;
  channelTopic?: string;
  messages: DiscordMessage[];
}

export function parseDiscordExport(text: string): ParsedDiscordExport {
  const doc = JSON.parse(text);
  const guildName = doc?.guild?.name;
  const channelName = doc?.channel?.name;
  const channelTopic = doc?.channel?.topic;
  const rawMessages = Array.isArray(doc?.messages) ? doc.messages : [];

  const messages: DiscordMessage[] = rawMessages.map((m: Record<string, unknown>) => {
    const author = m.author as Record<string, unknown> | undefined;
    const attachments = Array.isArray(m.attachments) ? m.attachments as Array<Record<string, unknown>> : [];
    const reactions = Array.isArray(m.reactions) ? m.reactions as Array<Record<string, unknown>> : [];
    const reactionCount = reactions.reduce((sum, r) => sum + (typeof r.count === "number" ? r.count : 0), 0);
    return {
      id: String(m.id ?? ""),
      timestamp: String(m.timestamp ?? ""),
      author: String((author?.nickname as string) ?? (author?.name as string) ?? "unknown"),
      authorId: author?.id ? String(author.id) : undefined,
      content: typeof m.content === "string" ? m.content : "",
      attachmentCount: attachments.length,
      attachmentUrls: attachments.map((a) => String(a.url ?? "")).filter(Boolean),
      reactionCount,
      isEdited: Boolean(m.timestampEdited),
      type: m.type ? String(m.type) : undefined,
    };
  });

  return { guildName, channelName, channelTopic, messages };
}

/** Per-author message-count summary for the analytics CSV variant. */
export function summarizeByAuthor(messages: DiscordMessage[]): Array<{
  author: string;
  messageCount: number;
  attachmentCount: number;
  reactionCount: number;
  charCount: number;
  firstMessage?: string;
  lastMessage?: string;
}> {
  const map = new Map<string, {
    messageCount: number;
    attachmentCount: number;
    reactionCount: number;
    charCount: number;
    firstMessage?: string;
    lastMessage?: string;
  }>();

  for (const m of messages) {
    const existing = map.get(m.author) ?? {
      messageCount: 0,
      attachmentCount: 0,
      reactionCount: 0,
      charCount: 0,
    };
    existing.messageCount += 1;
    existing.attachmentCount += m.attachmentCount;
    existing.reactionCount += m.reactionCount;
    existing.charCount += m.content.length;
    if (!existing.firstMessage || m.timestamp < existing.firstMessage) existing.firstMessage = m.timestamp;
    if (!existing.lastMessage || m.timestamp > existing.lastMessage) existing.lastMessage = m.timestamp;
    map.set(m.author, existing);
  }

  return Array.from(map.entries())
    .map(([author, stats]) => ({ author, ...stats }))
    .sort((a, b) => b.messageCount - a.messageCount);
}
