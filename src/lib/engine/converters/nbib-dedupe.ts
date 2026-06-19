import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis, buildNbib } from "../util/ris";
import { dedupeCitations } from "../util/citation-dedupe";

/**
 * NBIB de-duplicate. Parses a NBIB library, removes duplicate
 * references (same DOI, or same title + year when there is no DOI), and writes
 * NBIB back. Useful after merging exports from several databases.
 */
const nbibDedupe: Converter = {
  id: "nbib-dedupe",
  label: "NBIB Deduplicate",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".nbib"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const text = await input.text();
    let out: string;
    try {
      const citations = parseRis(text);
      if (citations.length === 0) throw new Error("No references found in the NBIB file");
      const { citations: deduped } = dedupeCitations(citations);
      out = buildNbib(deduped);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not deduplicate the NBIB file",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-research-info-systems;charset=utf-8" }),
      filename: swapExtension(input.name, "nbib"),
    };
  },
};

export default nbibDedupe;
