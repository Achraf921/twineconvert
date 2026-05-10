import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildEndnoteXml } from "../util/endnote-xml-build";

const risToEndnoteXml: Converter = {
  id: "ris-to-endnote-xml",
  label: "RIS → EndNote XML",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "application/xml",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let xml: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No citations found in RIS");
      xml = buildEndnoteXml(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to EndNote XML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([xml], { type: "application/xml" }),
      filename: swapExtension(input.name, "xml"),
    };
  },
};

export default risToEndnoteXml;
