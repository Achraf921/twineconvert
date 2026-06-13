import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEndnoteXml } from "../util/endnote-xml";
import { citationsToCsv } from "../util/citations-to-csv";

/**
 * EndNote XML → CSV. Converts via the unified Citation model: parse EndNote XML
 * into the shared bibliographic record, then write CSV. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const endnoteXmlToCsv: Converter = {
  id: "endnote-xml-to-csv",
  label: "EndNote XML → CSV",
  fromMime: ["application/xml", "text/xml"],
  accept: [".xml"],
  toMime: "text/csv",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseEndnoteXml(text);
      if (citations.length === 0) throw new Error("No references found in the EndNote XML file");
      out = await citationsToCsv(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote XML to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default endnoteXmlToCsv;
