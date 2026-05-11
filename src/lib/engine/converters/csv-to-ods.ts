import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const csvToOds: Converter = {
  id: "csv-to-ods",
  label: "CSV → ODS",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/vnd.oasis.opendocument.spreadsheet",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: ArrayBuffer;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await input.text(), { type: "string", raw: true });
      bytes = XLSX.write(wb, { bookType: "ods", type: "array" }) as ArrayBuffer;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to ODS",
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

export default csvToOds;
