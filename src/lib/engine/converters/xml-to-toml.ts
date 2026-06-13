import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * XML → TOML. Parses XML into a plain object and re-serialises it as
 * TOML. Structure (keys, nesting, scalars, arrays) carries across;
 * format-specific niceties (comments, anchors) are not preserved.
 */
const xmlToToml: Converter = {
  id: "xml-to-toml",
  label: "XML → TOML",
  fromMime: ["application/xml", "text/xml", "text/plain"],
  accept: [".xml"],
  toMime: "application/toml",
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
      const TOML = await import("@iarna/toml");
      out = TOML.stringify(obj as Parameters<typeof TOML.stringify>[0]);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XML to TOML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/toml;charset=utf-8" }),
      filename: swapExtension(input.name, "toml"),
    };
  },
};

export default xmlToToml;
