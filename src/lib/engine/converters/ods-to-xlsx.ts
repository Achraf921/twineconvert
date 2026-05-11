import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const odsToXlsx: Converter = {
  id: "ods-to-xlsx",
  label: "ODS → XLSX",
  fromMime: ["application/vnd.oasis.opendocument.spreadsheet"],
  accept: [".ods", ".ots"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: ArrayBuffer;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await input.arrayBuffer(), { type: "array" });
      // SheetJS round-trips workbooks structurally — formulas come through
      // as text, complex styles drop, but cell values + sheet names survive.
      // For a typical config-grade ODS file (data only) the round-trip is
      // content-preserving.
      bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ODS to XLSX",
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

export default odsToXlsx;
