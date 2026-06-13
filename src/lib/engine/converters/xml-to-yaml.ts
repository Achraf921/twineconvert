import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * XML → YAML. Parses XML into a plain object and re-serialises it as
 * YAML. Structure (keys, nesting, scalars, arrays) carries across;
 * format-specific niceties (comments, anchors) are not preserved.
 */
const xmlToYaml: Converter = {
  id: "xml-to-yaml",
  label: "XML → YAML",
  fromMime: ["application/xml", "text/xml", "text/plain"],
  accept: [".xml"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const { XMLParser } = await import("fast-xml-parser");
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", textNodeName: "#text", parseAttributeValue: true, trimValues: true });
      const obj = parser.parse(await input.text());
      if (obj == null || typeof obj !== "object") {
        throw new Error("The XML did not parse into a key/value document.");
      }
      const yaml = await import("js-yaml");
      out = yaml.dump(obj, { indent: 2, lineWidth: -1, schema: yaml.JSON_SCHEMA });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XML to YAML",
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

export default xmlToYaml;
