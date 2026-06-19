import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEnw, buildEnw } from "../util/enw";
import { dedupeCitations } from "../util/citation-dedupe";

/**
 * EndNote de-duplicate. Parses a EndNote library, removes duplicate
 * references (same DOI, or same title + year when there is no DOI), and writes
 * EndNote back. Useful after merging exports from several databases.
 */
const enwDedupe: Converter = {
  id: "enw-dedupe",
  label: "EndNote Deduplicate",
  fromMime: ["application/x-endnote-refer", "text/plain"],
  accept: [".enw"],
  toMime: "application/x-endnote-refer",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const text = await input.text();
    let out: string;
    try {
      const citations = parseEnw(text);
      if (citations.length === 0) throw new Error("No references found in the EndNote (.enw) file");
      const { citations: deduped } = dedupeCitations(citations);
      out = buildEnw(deduped);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not deduplicate the EndNote file",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-endnote-refer;charset=utf-8" }),
      filename: swapExtension(input.name, "enw"),
    };
  },
};

export default enwDedupe;
