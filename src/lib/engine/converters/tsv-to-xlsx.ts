import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const tsvToXlsx: Converter = {
  id: "tsv-to-xlsx",
  label: "TSV → XLSX",
  fromMime: ["text/tab-separated-values", "text/plain"],
  accept: [".tsv"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: ArrayBuffer;
    try {
      const XLSX = await import("xlsx");
      // Use SheetJS's CSV parser with explicit tab delimiter — reusing
      // the same workbook model means TSV gets the same number/date
      // inference treatment as CSV → XLSX.
      const wb = XLSX.read(await input.text(), { type: "string", FS: "\t" });
      bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert TSV to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default tsvToXlsx;
