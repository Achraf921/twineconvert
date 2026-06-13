import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEndnoteXml } from "../util/endnote-xml";
import { buildMods } from "../util/mods";

/**
 * EndNote XML → MODS. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const endnoteXmlToMods: Converter = {
  id: "endnote-xml-to-mods",
  label: "EndNote XML → MODS",
  fromMime: ["application/xml", "text/xml"],
  accept: [".xml"],
  toMime: "application/mods+xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseEndnoteXml(text);
      if (citations.length === 0) throw new Error("No references found in the EndNote XML file");
      out = buildMods(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote XML to MODS",
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

export default endnoteXmlToMods;
