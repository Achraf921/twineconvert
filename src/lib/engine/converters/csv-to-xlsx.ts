import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { stripCsvPreamble } from "../util/csv-parse-flex";

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
      const XLSXModule = await import("xlsx");
      // CJS-interop quirk: depending on Node version, the namespace either
      // exposes the methods directly OR wraps them in a `default` export.
      // Handle both shapes.
      const XLSX = XLSXModule.default ?? XLSXModule;
      const { text, delimiter } = stripCsvPreamble(await input.text());
      const Papa = (await import("papaparse")).default;
      const parsed = Papa.parse<string[]>(text, {
        skipEmptyLines: true,
        ...(delimiter ? { delimiter } : {}),
      });
      if (!parsed.data || parsed.data.length === 0) {
        throw new Error("CSV input has no rows");
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(parsed.data);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      // SheetJS sometimes returns a plain ArrayBuffer instead of Uint8Array
      // depending on its internal path. Normalize.
      const bytes: Uint8Array =
        out instanceof Uint8Array
          ? out
          : out instanceof ArrayBuffer
          ? new Uint8Array(out)
          : new Uint8Array(out as ArrayBufferLike);
      buf = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not write XLSX from CSV",
        err,
      );
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
