import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis, buildRis } from "../util/ris";
import { dedupeCitations } from "../util/citation-dedupe";

/**
 * RIS de-duplicate. Parses a RIS library, removes duplicate
 * references (same DOI, or same title + year when there is no DOI), and
 * writes RIS back. Useful after merging exports from several databases
 * (PubMed, Scopus, Web of Science) that return the same papers.
 */
const risDedupe: Converter = {
  id: "ris-dedupe",
  label: "RIS Deduplicate",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No references found in the RIS file");
      const { citations: deduped } = dedupeCitations(citations);
      out = buildRis(deduped);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not deduplicate the RIS file",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-research-info-systems;charset=utf-8" }),
      filename: swapExtension(input.name, "ris"),
    };
  },
};

export default risDedupe;
