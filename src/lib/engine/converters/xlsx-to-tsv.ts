import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const xlsxToTsv: Converter = {
  id: "xlsx-to-tsv",
  label: "XLSX → TSV",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  accept: [".xlsx", ".xls"],
  toMime: "text/tab-separated-values",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let tsv: string;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await input.arrayBuffer(), { type: "array" });
      const firstSheet = wb.SheetNames[0];
      if (!firstSheet) throw new Error("Workbook has no sheets");
      tsv = XLSX.utils.sheet_to_csv(wb.Sheets[firstSheet], { FS: "\t" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XLSX to TSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" }),
      filename: swapExtension(input.name, "tsv"),
    };
  },
};

export default xlsxToTsv;
