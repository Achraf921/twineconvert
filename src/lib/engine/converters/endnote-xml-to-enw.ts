import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEndnoteXml } from "../util/endnote-xml";
import { buildEnw } from "../util/enw";

/**
 * EndNote XML → EndNote ENW. Converts through the unified Citation model so every field
 * that round-trips across the citation family round-trips here too.
 */
const endnoteXmlToEnw: Converter = {
  id: "endnote-xml-to-enw",
  label: "EndNote XML → EndNote ENW",
  fromMime: ["application/xml", "text/xml"],
  accept: [".xml"],
  toMime: "application/x-endnote-refer",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseEndnoteXml(text);
      if (citations.length === 0) throw new Error("No references found in the EndNote XML file");
      out = buildEnw(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote XML to EndNote ENW",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-endnote-refer;charset=utf-8" }),
      filename: swapExtension(input.name, "enw"),
    };
  },
};

export default endnoteXmlToEnw;
