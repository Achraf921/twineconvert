import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractDois } from "../util/extract-identifiers";

/**
 * Extract DOIs from pasted text. Scans a reference section, search-results
 * page or any text blob and returns the unique DOIs, one per line, in the
 * order they first appear. Handy for batching a lookup or an ILL request.
 */
const textToDois: Converter = {
  id: "text-to-dois",
  label: "Text → DOIs",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const ids = extractDois(await input.text());
      if (ids.length === 0) {
        throw new Error("No DOIs found in the text.");
      }
      out = ids.join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not extract DOIs",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default textToDois;
