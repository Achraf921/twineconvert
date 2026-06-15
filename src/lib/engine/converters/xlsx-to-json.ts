import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * XLSX → JSON. First sheet only. Output is an array of row objects keyed
 * by the header row (default SheetJS behavior with `{ header: undefined }`).
 */
const xlsxToJson: Converter = {
  id: "xlsx-to-json",
  label: "XLSX → JSON",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  toMime: "application/json",
  accept: [".xlsx", ".xls"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let rows: unknown[];
    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await input.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("Workbook has no sheets");
      const sheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } catch (err) {
      throw new ConvertFailedError("Could not parse spreadsheet", err);
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new ConvertFailedError(
        "The spreadsheet's first sheet has no data rows. Check the file isn't empty or corrupt, and that your data is on the first sheet.",
      );
    }
    const json = JSON.stringify(rows, null, 2);
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default xlsxToJson;
