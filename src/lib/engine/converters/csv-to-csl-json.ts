import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { citationInputHint } from "../util/citation-input-hint";
import { buildCslJson } from "../util/csl-json";

/**
 * CSV → CSL-JSON. Converts via the unified Citation model: parse CSV
 * into the shared bibliographic record, then write CSL-JSON. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const csvToCslJson: Converter = {
  id: "csv-to-csl-json",
  label: "CSV → CSL-JSON",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/vnd.citationstyles.csl+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const text = await input.text();
    let citations;
    try {
      citations = await citationsFromCsv(text);
    } catch (err) {
      const hint = citationInputHint(text, "references-to-csl-json", "pubmed-to-ris");
      throw new ConvertFailedError(
        hint ?? (err instanceof Error ? err.message : "Could not convert CSV to CSL-JSON"),
        err,
      );
    }
    if (citations.length === 0) {
      const hint = citationInputHint(text, "references-to-csl-json", "pubmed-to-ris");
      throw new ConvertFailedError(hint ?? "No references found in the CSV file");
    }
    const out = buildCslJson(citations);
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/vnd.citationstyles.csl+json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default csvToCslJson;
