import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseDiscordExport, summarizeByAuthor } from "../util/discord-chat";

/**
 * DiscordChatExporter JSON → per-author summary CSV. One row per
 * participant with message count, attachment count, reaction count,
 * total characters, and date range. Used for community moderation
 * dashboards and "who's talking the most" investigations.
 */
const discordChatSummaryCsv: Converter = {
  id: "discord-chat-summary-csv",
  label: "Discord Chat → Summary CSV (per author)",
  fromMime: ["application/json"],
  accept: [".json"],
  toMime: "text/csv",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const parsed = parseDiscordExport(await input.text());
      const summary = summarizeByAuthor(parsed.messages);
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(summary);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not summarize Discord export",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default discordChatSummaryCsv;
