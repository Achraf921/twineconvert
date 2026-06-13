import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMods } from "../util/mods";
import { buildEndnoteXml } from "../util/endnote-xml-build";

/**
 * MODS → EndNote XML. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const modsToEndnoteXml: Converter = {
  id: "mods-to-endnote-xml",
  label: "MODS → EndNote XML",
  fromMime: ["application/mods+xml", "application/xml", "text/xml"],
  accept: [".xml", ".mods"],
  toMime: "application/xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseMods(text);
      if (citations.length === 0) throw new Error("No references found in the MODS file");
      out = buildEndnoteXml(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MODS to EndNote XML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/xml;charset=utf-8" }),
      filename: swapExtension(input.name, "xml"),
    };
  },
};

export default modsToEndnoteXml;
