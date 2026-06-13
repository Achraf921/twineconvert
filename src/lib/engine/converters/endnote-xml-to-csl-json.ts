import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEndnoteXml } from "../util/endnote-xml";
import { buildCslJson } from "../util/csl-json";

/**
 * EndNote XML → CSL-JSON. Converts via the unified Citation model: parse EndNote XML
 * into the shared bibliographic record, then write CSL-JSON. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const endnoteXmlToCslJson: Converter = {
  id: "endnote-xml-to-csl-json",
  label: "EndNote XML → CSL-JSON",
  fromMime: ["application/xml", "text/xml"],
  accept: [".xml"],
  toMime: "application/vnd.citationstyles.csl+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseEndnoteXml(text);
      if (citations.length === 0) throw new Error("No references found in the EndNote XML file");
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote XML to CSL-JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/vnd.citationstyles.csl+json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default endnoteXmlToCslJson;
