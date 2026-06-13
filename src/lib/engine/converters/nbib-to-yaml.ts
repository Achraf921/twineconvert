import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildCslJson } from "../util/csl-json";

/**
 * NBIB → CSL-YAML for Pandoc bibliographies (`--bibliography refs.yaml`). Parses NBIB into the unified Citation model, then emits the CSL list as YAML.
 */
const nbibToYaml: Converter = {
  id: "nbib-to-yaml",
  label: "NBIB → YAML (CSL)",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".nbib"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const yaml = await import("js-yaml");
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No references found in the NBIB file");
      const cslArr = JSON.parse(buildCslJson(citations));
      out = yaml.dump({ references: cslArr }, { indent: 2, lineWidth: -1, schema: yaml.JSON_SCHEMA });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert NBIB to YAML (CSL)",
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

export default nbibToYaml;
