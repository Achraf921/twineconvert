import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * XLSX → CSV. Returns the FIRST sheet only — multi-sheet output (returning
 * a ZIP of CSVs) is a separate tool.
 */
const xlsxToCsv: Converter = {
  id: "xlsx-to-csv",
  label: "XLSX → CSV",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  toMime: "text/csv",
  accept: [".xlsx", ".xls"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await input.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("Workbook has no sheets");
      const sheet = workbook.Sheets[firstSheetName];
      csv = XLSX.utils.sheet_to_csv(sheet);
    } catch (err) {
      throw new ConvertFailedError("Could not parse spreadsheet", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default xlsxToCsv;
