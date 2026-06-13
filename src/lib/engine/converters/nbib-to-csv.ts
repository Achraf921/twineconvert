import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { citationsToCsv } from "../util/citations-to-csv";

/**
 * NBIB → CSV. Converts via the unified Citation model: parse NBIB
 * into the shared bibliographic record, then write CSV. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const nbibToCsv: Converter = {
  id: "nbib-to-csv",
  label: "NBIB → CSV",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".nbib"],
  toMime: "text/csv",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseRis(text);
      if (citations.length === 0) throw new Error("No references found in the NBIB file");
      out = await citationsToCsv(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert NBIB to CSV",
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

export default nbibToCsv;
