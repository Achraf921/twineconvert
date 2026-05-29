import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseWhatsapp } from "../util/whatsapp-parse";

const whatsappChatToCsv: Converter = {
  id: "whatsapp-chat-to-csv",
  label: "WhatsApp Chat → CSV",
  fromMime: ["text/plain", "application/zip"],
  accept: [".txt", ".zip"],
  toMime: "text/csv",
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const parsed = await parseWhatsapp(input);
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        parsed.messages.map((m) => ({
          timestamp: m.timestamp,
          sender: m.sender ?? "[system]",
          text: m.text,
          mediaFilename: m.mediaFilename ?? "",
          isSystem: m.isSystem ? "true" : "false",
        })),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse WhatsApp chat",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name.replace(/\.zip$/i, ".txt"), "csv"),
    };
  },
};

export default whatsappChatToCsv;
