import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMsg } from "../util/msg";

/**
 * MSG → CSV. Emits one row with the headers Outlook users typically
 * want to index (date, from, to, cc, subject, message-id, attachments
 * count). Same column shape as our mbox-to-csv so a folder full of
 * .msg files can be processed one by one and the rows concatenated.
 */
const msgToCsv: Converter = {
  id: "msg-to-csv",
  label: "MSG → CSV",
  fromMime: ["application/vnd.ms-outlook", "application/x-msg", "application/octet-stream"],
  accept: [".msg"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const msg = await parseMsg(await input.arrayBuffer());
      if (!msg.subject && !msg.from && !msg.body) {
        throw new Error(
          "MSG had no readable subject, sender, or body. The file may be a calendar item or task rather than an email.",
        );
      }
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse([
        {
          date: msg.date,
          from: msg.from,
          to: msg.to,
          cc: msg.cc,
          subject: msg.subject,
          messageId: msg.messageId,
          attachments: msg.attachments.length,
        },
      ]);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MSG to CSV",
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

export default msgToCsv;
