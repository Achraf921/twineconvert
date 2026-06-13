import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { citationsToCsv } from "../util/citations-to-csv";

/**
 * CSL-JSON → CSV. Converts via the unified Citation model: parse CSL-JSON
 * into the shared bibliographic record, then write CSV. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const cslJsonToCsv: Converter = {
  id: "csl-json-to-csv",
  label: "CSL-JSON → CSV",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/csv",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseCslJson(text);
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      out = await citationsToCsv(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to CSV",
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

export default cslJsonToCsv;
