import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEndnoteXml } from "../util/endnote-xml";
import { buildCslJson } from "../util/csl-json";

/**
 * EndNote XML → CSL-YAML for Pandoc bibliographies (`--bibliography refs.yaml`). Parses EndNote XML into the unified Citation model, then emits the CSL list as YAML.
 */
const endnoteXmlToYaml: Converter = {
  id: "endnote-xml-to-yaml",
  label: "EndNote XML → YAML (CSL)",
  fromMime: ["application/xml", "text/xml"],
  accept: [".xml"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const yaml = await import("js-yaml");
      const citations = parseEndnoteXml(await input.text());
      if (citations.length === 0) throw new Error("No references found in the EndNote XML file");
      const cslArr = JSON.parse(buildCslJson(citations));
      out = yaml.dump({ references: cslArr }, { indent: 2, lineWidth: -1, schema: yaml.JSON_SCHEMA });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote XML to YAML (CSL)",
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

export default endnoteXmlToYaml;
