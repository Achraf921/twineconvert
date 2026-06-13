import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEndnoteXml } from "../util/endnote-xml";
import { citationsToCsv } from "../util/citations-to-csv";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * EndNote XML → XLSX. Converts via the unified Citation model: parse EndNote XML
 * into the shared bibliographic record, then write XLSX. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const endnoteXmlToXlsx: Converter = {
  id: "endnote-xml-to-xlsx",
  label: "EndNote XML → XLSX",
  fromMime: ["application/xml", "text/xml"],
  accept: [".xml"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const text = await input.text();
      const citations = parseEndnoteXml(text);
      if (citations.length === 0) throw new Error("No references found in the EndNote XML file");
      const csv = await citationsToCsv(citations);
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote XML to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default endnoteXmlToXlsx;
