import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * MBOX → EML.
 *
 * Note: the converter contract is single-in, single-out. An mbox typically
 * contains many messages — we can't easily emit N separate .eml files
 * without packaging them in a zip. For v1 we DO produce a single .eml
 * file holding the FIRST message — that satisfies the most-common search
 * intent ("I have an mbox, I want to look at one specific email"). For
 * "extract all messages as EMLs" we'd need a zip-output variant which
 * the engine doesn't support yet.
 */
const mboxToEml: Converter = {
  id: "mbox-to-eml",
  label: "MBOX → EML (first message)",
  fromMime: ["application/mbox", "text/plain"],
  accept: [".mbox"],
  toMime: "message/rfc822",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let eml: string;
    try {
      const text = await input.text();
      const blocks = text.split(/\r?\n(?=From .+\d{4})/);
      const first = (blocks[0] ?? "").replace(/^From .+\n/, "");
      if (!first.trim()) throw new Error("MBOX is empty");
      eml = first;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not extract EML from MBOX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([eml], { type: "message/rfc822" }),
      filename: swapExtension(input.name, "eml"),
    };
  },
};

export default mboxToEml;
