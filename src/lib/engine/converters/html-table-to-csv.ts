import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseHtmlTable, tableToCsvRows } from "../util/tables";

const htmlTableToCsv: Converter = {
  id: "html-table-to-csv",
  label: "HTML table → CSV",
  fromMime: ["text/html"],
  accept: [".html", ".htm"],
  toMime: "text/csv",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const table = parseHtmlTable(await input.text());
      csv = Papa.unparse(tableToCsvRows(table));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HTML table to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv + "\n"], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default htmlTableToCsv;
