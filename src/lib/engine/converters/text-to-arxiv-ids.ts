import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractArxivIds } from "../util/extract-identifiers";

/**
 * Extract arXiv IDs from pasted text. Scans a reference section, search-results
 * page or any text blob and returns the unique arXiv IDs, one per line, in the
 * order they first appear. Handy for batching a lookup or an ILL request.
 */
const textToArxivIds: Converter = {
  id: "text-to-arxiv-ids",
  label: "Text → arXiv IDs",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const ids = extractArxivIds(await input.text());
      if (ids.length === 0) {
        throw new Error("No arXiv IDs (they must appear with an arXiv prefix) found in the text.");
      }
      out = ids.join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not extract arXiv IDs",
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

export default textToArxivIds;
