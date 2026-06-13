import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { citationsToCsv } from "../util/citations-to-csv";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * CSL-JSON → XLSX. Converts via the unified Citation model: parse CSL-JSON
 * into the shared bibliographic record, then write XLSX. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const cslJsonToXlsx: Converter = {
  id: "csl-json-to-xlsx",
  label: "CSL-JSON → XLSX",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const text = await input.text();
      const citations = parseCslJson(text);
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      const csv = await citationsToCsv(citations);
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to XLSX",
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

export default cslJsonToXlsx;
