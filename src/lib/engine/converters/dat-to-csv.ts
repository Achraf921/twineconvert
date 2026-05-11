import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseDat } from "../util/edisco";

/**
 * Concordance/Relativity DAT load file → CSV. DAT uses non-printable
 * Unicode delimiters to avoid quote-escaping issues; opening one in
 * Excel just shows garbled þ characters. Converting to CSV gives every
 * paralegal and case manager a workable spreadsheet view of the
 * production metadata + extracted text.
 */
const datToCsv: Converter = {
  id: "dat-to-csv",
  label: "DAT → CSV",
  fromMime: ["application/vnd.concordance-dat", "text/plain"],
  accept: [".dat"],
  toMime: "text/csv",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const table = parseDat(await input.text());
      csv = Papa.unparse(
        { fields: table.headers, data: table.rows },
        { newline: "\n" },
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DAT to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv + "\n"], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default datToCsv;
