import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON → XML via fast-xml-parser's builder. Uses the same `@` prefix
 * convention as xml-to-json so the round-trip preserves attributes
 * vs child elements:
 *
 *   { "book": { "@id": "1", "title": "Foo" } }
 *
 * becomes
 *
 *   <?xml version="1.0" encoding="UTF-8"?>
 *   <book id="1">
 *     <title>Foo</title>
 *   </book>
 */
const jsonToXml: Converter = {
  id: "json-to-xml",
  label: "JSON → XML",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let xml: string;
    try {
      const { XMLBuilder } = await import("fast-xml-parser");
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@",
        textNodeName: "#text",
        format: true,
        indentBy: "  ",
        suppressEmptyNode: false,
      });
      const parsed: unknown = JSON.parse(await input.text());
      const xmlBody = builder.build(parsed);
      xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not write XML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([xml], { type: "application/xml;charset=utf-8" }),
      filename: swapExtension(input.name, "xml"),
    };
  },
};

export default jsonToXml;
