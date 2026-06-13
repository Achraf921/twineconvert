import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildRefworks } from "../util/refworks";

/**
 * RIS → RefWorks. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const risToRefworks: Converter = {
  id: "ris-to-refworks",
  label: "RIS → RefWorks",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "text/x-refworks",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseRis(text);
      if (citations.length === 0) throw new Error("No references found in the RIS file");
      out = buildRefworks(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to RefWorks",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/x-refworks;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default risToRefworks;
