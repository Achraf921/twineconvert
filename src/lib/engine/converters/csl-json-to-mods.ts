import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { buildMods } from "../util/mods";

/**
 * CSL-JSON → MODS. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const cslJsonToMods: Converter = {
  id: "csl-json-to-mods",
  label: "CSL-JSON → MODS",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/mods+xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseCslJson(text);
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      out = buildMods(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to MODS",
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

export default cslJsonToMods;
