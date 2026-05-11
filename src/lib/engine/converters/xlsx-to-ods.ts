import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const xlsxToOds: Converter = {
  id: "xlsx-to-ods",
  label: "XLSX → ODS",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  accept: [".xlsx", ".xls"],
  toMime: "application/vnd.oasis.opendocument.spreadsheet",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: ArrayBuffer;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await input.arrayBuffer(), { type: "array" });
      bytes = XLSX.write(wb, { bookType: "ods", type: "array" }) as ArrayBuffer;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XLSX to ODS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bytes], { type: "application/vnd.oasis.opendocument.spreadsheet" }),
      filename: swapExtension(input.name, "ods"),
    };
  },
};

export default xlsxToOds;
