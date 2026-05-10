import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseX12, segmentsToCsvRows } from "../util/edi";

const ediToCsv: Converter = {
  id: "edi-to-csv",
  label: "EDI X12 → CSV",
  fromMime: ["application/edi-x12", "text/plain"],
  accept: [".edi", ".x12", ".850", ".810", ".856", ".997"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const segments = parseX12(await input.text());
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(segmentsToCsvRows(segments));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse EDI X12",
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

export default ediToCsv;
