import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMbox } from "../util/email-parse";

/**
 * MBOX → CSV. One row per message with the headers people actually
 * triage/e-discover on (date, from, to, cc, subject, message-id,
 * attachment count). Bodies are intentionally excluded: an mbox archive
 * is usually being turned into a spreadsheet index, not a content dump.
 */
const mboxToCsv: Converter = {
  id: "mbox-to-csv",
  label: "MBOX → CSV",
  fromMime: ["application/mbox", "text/plain"],
  accept: [".mbox"],
  toMime: "text/csv",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const text = await input.text();
      const messages = await parseMbox(text);
      if (messages.length === 0) throw new Error("No messages found in MBOX file");
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        messages.map((m) => ({
          date: m.date ?? "",
          from: m.from ?? "",
          to: m.to ?? "",
          cc: m.cc ?? "",
          subject: m.subject ?? "",
          messageId: m.messageId ?? "",
          attachments: m.attachments.length,
        })),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MBOX to CSV",
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

export default mboxToCsv;
