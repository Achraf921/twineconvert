import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMods } from "../util/mods";
import { buildCslJson } from "../util/csl-json";

/**
 * MODS → YAML (CSL). Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const modsToYaml: Converter = {
  id: "mods-to-yaml",
  label: "MODS → YAML (CSL)",
  fromMime: ["application/mods+xml", "application/xml", "text/xml"],
  accept: [".xml", ".mods"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const yaml = await import("js-yaml");
      const text = await input.text();
      const citations = parseMods(text);
      if (citations.length === 0) throw new Error("No references found in the MODS file");
      const cslArr = JSON.parse(buildCslJson(citations));
      out = yaml.dump({ references: cslArr }, { indent: 2, lineWidth: -1, schema: yaml.JSON_SCHEMA });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MODS to YAML (CSL)",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-yaml;charset=utf-8" }),
      filename: swapExtension(input.name, "yaml"),
    };
  },
};

export default modsToYaml;
