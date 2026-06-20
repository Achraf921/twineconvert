import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCff } from "../util/cff";
import { buildRis } from "../util/ris";

/**
 * CITATION.cff to RIS. Parses a Citation File Format (CFF) document, the
 * YAML "Cite this software" file from GitHub/Zenodo, and writes RIS.
 */
const cffToRis: Converter = {
  id: "cff-to-ris",
  label: "CFF to RIS",
  fromMime: ["application/x-yaml", "text/yaml", "text/plain"],
  accept: [".cff", ".yaml", ".yml"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = await parseCff(await input.text());
      if (citations.length === 0) throw new Error("No citation found in the CITATION.cff file");
      out = buildRis(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CFF to RIS",
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

export default cffToRis;
