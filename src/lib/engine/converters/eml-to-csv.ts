import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEml } from "../util/email-parse";

/**
 * EML → CSV. Single-message metadata as a one-row CSV. Useful for
 * users batching many .eml files and merging, they can run this on
 * each then concat. The mbox-to-csv route exists for the multi-message
 * case where the input is already a single mbox bundle.
 */
const emlToCsv: Converter = {
  id: "eml-to-csv",
  label: "EML → CSV",
  fromMime: ["message/rfc822", "text/plain"],
  accept: [".eml"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const text = await input.text();
      const email = await parseEml(text);
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse([
        {
          from: email.from ?? "",
          to: email.to ?? "",
          cc: email.cc ?? "",
          subject: email.subject ?? "",
          date: email.date ?? "",
          messageId: email.messageId ?? "",
          textBody: email.textBody ?? "",
          attachmentCount: email.attachments.length,
          attachmentNames: email.attachments.map((a) => a.filename).join("; "),
        },
      ]);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse EML",
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

export default emlToCsv;
