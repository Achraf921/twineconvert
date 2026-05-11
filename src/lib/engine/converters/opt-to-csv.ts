import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { optToTable, parseOpt } from "../util/edisco";

/**
 * Concordance OPT image-load file → CSV. OPT files map Bates page IDs
 * to image file paths (TIF, PDF, JPG) within a production volume. The
 * format predates standard CSV escaping rules so embedded commas in
 * file paths can break it; converting to a real CSV gives a paralegal
 * a clean spreadsheet view of every page in a production with proper
 * column headers (PageID, Volume, ImagePath, IsBoundary, etc.).
 */
const optToCsv: Converter = {
  id: "opt-to-csv",
  label: "OPT → CSV",
  fromMime: ["application/vnd.concordance-opt", "text/plain"],
  accept: [".opt"],
  toMime: "text/csv",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const rows = parseOpt(await input.text());
      if (rows.length === 0) throw new Error("OPT file has no rows");
      const table = optToTable(rows);
      csv = Papa.unparse(
        { fields: table.headers, data: table.rows },
        { newline: "\n" },
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert OPT to CSV",
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

export default optToCsv;
