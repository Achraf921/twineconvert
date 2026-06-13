import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildMods } from "../util/mods";

/**
 * NBIB → MODS. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const nbibToMods: Converter = {
  id: "nbib-to-mods",
  label: "NBIB → MODS",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".nbib"],
  toMime: "application/mods+xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseRis(text);
      if (citations.length === 0) throw new Error("No references found in the NBIB file");
      out = buildMods(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert NBIB to MODS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/mods+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "xml"),
    };
  },
};

export default nbibToMods;
