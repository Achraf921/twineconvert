import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarcxml } from "../util/marcxml";
import { buildCslJson } from "../util/csl-json";

/**
 * MARCXML → YAML (CSL). Parses MARC21 slim XML (the format library catalogs export)
 * into the unified Citation model, then writes YAML (CSL).
 * Import-only.
 */
const marcxmlToYaml: Converter = {
  id: "marcxml-to-yaml",
  label: "MARCXML → YAML (CSL)",
  fromMime: ["application/marcxml+xml", "application/xml", "text/xml"],
  accept: [".xml", ".marcxml", ".mrcx"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const yaml = await import("js-yaml");
      const text = await input.text();
      const citations = parseMarcxml(text);
      if (citations.length === 0) throw new Error("No records found in the MARCXML file");
      const cslArr = JSON.parse(buildCslJson(citations));
      out = yaml.dump({ references: cslArr }, { indent: 2, lineWidth: -1, schema: yaml.JSON_SCHEMA });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MARCXML to YAML (CSL)",
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

export default marcxmlToYaml;
