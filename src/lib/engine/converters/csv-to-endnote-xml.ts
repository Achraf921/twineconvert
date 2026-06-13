import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { buildEndnoteXml } from "../util/endnote-xml-build";

/**
 * CSV → EndNote XML. Converts via the unified Citation model: parse CSV
 * into the shared bibliographic record, then write EndNote XML. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const csvToEndnoteXml: Converter = {
  id: "csv-to-endnote-xml",
  label: "CSV → EndNote XML",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = await citationsFromCsv(text);
      if (citations.length === 0) throw new Error("No references found in the CSV file");
      out = buildEndnoteXml(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to EndNote XML",
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

export default csvToEndnoteXml;
