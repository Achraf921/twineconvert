import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEdifact, segmentsToCsvRows } from "../util/edi";

const edifactToCsv: Converter = {
  id: "edifact-to-csv",
  label: "EDIFACT → CSV",
  fromMime: ["application/edifact", "text/plain"],
  accept: [".edi", ".edifact", ".txt"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const segments = parseEdifact(await input.text());
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(segmentsToCsvRows(segments));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse EDIFACT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default edifactToCsv;
