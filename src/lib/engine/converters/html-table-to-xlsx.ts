import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseHtmlTable, tableToCsvRows } from "../util/tables";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * HTML Table → XLSX. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const htmlTableToXlsx: Converter = {
  id: "html-table-to-xlsx",
  label: "HTML Table → XLSX",
  fromMime: ["text/html", "text/plain"],
  accept: [".html", ".htm"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const table = parseHtmlTable(await input.text());
      const Papa = (await import("papaparse")).default;
      const csv = Papa.unparse(tableToCsvRows(table));
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HTML Table to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default htmlTableToXlsx;
