import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * EML → MBOX. mbox is a concatenation of EMLs, each preceded by a
 * "From " separator line. For a single-EML input, the mbox output is
 * trivially just the EML wrapped in the separator.
 *
 * Per the mbox spec, "From " in body lines must be escaped to ">From "
 * to avoid being misread as another message boundary. We apply that.
 */
const emlToMbox: Converter = {
  id: "eml-to-mbox",
  label: "EML → MBOX",
  fromMime: ["message/rfc822", "text/plain"],
  accept: [".eml"],
  toMime: "application/mbox",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let mbox: string;
    try {
      const text = await input.text();
      // Heuristic for the From-line date: parse the EML's Date: header,
      // fall back to current time if absent.
      const dateMatch = text.match(/^Date:\s*(.+)$/im);
      const dateStr = dateMatch
        ? new Date(dateMatch[1]).toUTCString().replace(/^[A-Z][a-z]+, /, "")
        : new Date().toUTCString().replace(/^[A-Z][a-z]+, /, "");
      const fromMatch = text.match(/^From:\s*<?([\w.\-+]+@[\w.-]+)>?/im);
      const fromAddr = fromMatch ? fromMatch[1] : "unknown@example.com";
      const escaped = text.replace(/^From /gm, ">From ");
      mbox = `From ${fromAddr} ${dateStr}\n${escaped}\n`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not wrap EML into MBOX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([mbox], { type: "application/mbox" }),
      filename: swapExtension(input.name, "mbox"),
    };
  },
};

export default emlToMbox;
