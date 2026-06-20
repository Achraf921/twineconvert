import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCff } from "../util/cff";
import { buildCslJson } from "../util/csl-json";

/**
 * CITATION.cff to CSL-JSON. Parses a Citation File Format (CFF) document, the
 * YAML "Cite this software" file from GitHub/Zenodo, and writes CSL-JSON.
 */
const cffToCslJson: Converter = {
  id: "cff-to-csl-json",
  label: "CFF to CSL-JSON",
  fromMime: ["application/x-yaml", "text/yaml", "text/plain"],
  accept: [".cff", ".yaml", ".yml"],
  toMime: "application/json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = await parseCff(await input.text());
      if (citations.length === 0) throw new Error("No citation found in the CITATION.cff file");
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CFF to CSL-JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default cffToCslJson;
