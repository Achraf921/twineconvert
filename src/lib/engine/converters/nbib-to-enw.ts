import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildEnw } from "../util/enw";

/**
 * NBIB → EndNote ENW. Converts through the unified Citation model so every field
 * that round-trips across the citation family round-trips here too.
 */
const nbibToEnw: Converter = {
  id: "nbib-to-enw",
  label: "NBIB → EndNote ENW",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".nbib"],
  toMime: "application/x-endnote-refer",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseRis(text);
      if (citations.length === 0) throw new Error("No references found in the NBIB file");
      out = buildEnw(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert NBIB to EndNote ENW",
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

export default nbibToEnw;
