import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { citationsToCsv } from "../util/citations-to-csv";
import { dedupeCitations } from "../util/citation-dedupe";

/**
 * CSV de-duplicate. Parses a CSV library, removes duplicate
 * references (same DOI, or same title + year when there is no DOI), and writes
 * CSV back. Useful after merging exports from several databases.
 */
const csvDedupe: Converter = {
  id: "csv-dedupe",
  label: "CSV Deduplicate",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "text/csv",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const text = await input.text();
    let out: string;
    try {
      const citations = await citationsFromCsv(text);
      if (citations.length === 0) throw new Error("No references found in the CSV file");
      const { citations: deduped } = dedupeCitations(citations);
      out = await citationsToCsv(deduped);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not deduplicate the CSV file",
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

export default csvDedupe;
