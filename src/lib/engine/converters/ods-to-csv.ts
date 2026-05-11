import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const odsToCsv: Converter = {
  id: "ods-to-csv",
  label: "ODS → CSV",
  fromMime: [
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.spreadsheet-template",
  ],
  accept: [".ods", ".ots"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await input.arrayBuffer(), { type: "array" });
      const firstSheet = wb.SheetNames[0];
      if (!firstSheet) throw new Error("ODS has no sheets");
      csv = XLSX.utils.sheet_to_csv(wb.Sheets[firstSheet]);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ODS to CSV",
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

export default odsToCsv;
