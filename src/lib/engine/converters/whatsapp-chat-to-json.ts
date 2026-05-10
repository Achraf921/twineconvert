import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseWhatsapp } from "../util/whatsapp-parse";

const whatsappChatToJson: Converter = {
  id: "whatsapp-chat-to-json",
  label: "WhatsApp Chat → JSON",
  fromMime: ["text/plain", "application/zip"],
  accept: [".txt", ".zip"],
  toMime: "application/json",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const parsed = await parseWhatsapp(input);
      // Strip the media Map, JSON can't represent Blobs anyway.
      const { messages, participantCounts } = parsed;
      json = JSON.stringify({ messages, participantCounts }, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse WhatsApp chat",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name.replace(/\.zip$/i, ".txt"), "json"),
    };
  },
};

export default whatsappChatToJson;
