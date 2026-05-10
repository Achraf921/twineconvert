import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const csvToXlsx: Converter = {
  id: "csv-to-xlsx",
  label: "CSV → XLSX",
  fromMime: ["text/csv", "application/csv"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  accept: [".csv"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const XLSX = await import("xlsx");
      const text = await input.text();
      const workbook = XLSX.read(text, { type: "string" });
      // SheetJS' write() returns a Uint8Array when type is "array".
      const out = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
      const bytes = out as Uint8Array;
      buf = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
    } catch (err) {
      throw new ConvertFailedError("Could not write XLSX from CSV", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default csvToXlsx;
