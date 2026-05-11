import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * XML → JSON via fast-xml-parser. The mapping XML-to-JSON isn't
 * canonical (the W3C never standardized one), so any conversion is
 * opinionated. We use the "preserve order: false, attribute prefix: @"
 * convention which is the most common one in tooling and what most
 * developers expect when they see "convert this XML to JSON":
 *
 *   <book id="1"><title>Foo</title></book>
 *
 * becomes
 *
 *   { "book": { "@id": "1", "title": "Foo" } }
 */
const xmlToJson: Converter = {
  id: "xml-to-json",
  label: "XML → JSON",
  fromMime: ["application/xml", "text/xml", "text/plain"],
  accept: [".xml"],
  toMime: "application/json",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const { XMLParser } = await import("fast-xml-parser");
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@",
        textNodeName: "#text",
        parseAttributeValue: true,
        trimValues: true,
      });
      const obj = parser.parse(await input.text());
      json = JSON.stringify(obj, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse XML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default xmlToJson;
