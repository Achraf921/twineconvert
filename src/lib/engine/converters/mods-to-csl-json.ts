import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMods } from "../util/mods";
import { buildCslJson } from "../util/csl-json";

/**
 * MODS → CSL-JSON. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const modsToCslJson: Converter = {
  id: "mods-to-csl-json",
  label: "MODS → CSL-JSON",
  fromMime: ["application/mods+xml", "application/xml", "text/xml"],
  accept: [".xml", ".mods"],
  toMime: "application/vnd.citationstyles.csl+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseMods(text);
      if (citations.length === 0) throw new Error("No references found in the MODS file");
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MODS to CSL-JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/vnd.citationstyles.csl+json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default modsToCslJson;
