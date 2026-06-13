import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseHtmlTable, tableToCsvRows } from "../util/tables";
import { rowsToCsv } from "../util/rows-to-csv";

/**
 * HTML table → CSV. Extracts the first <table> from the HTML, decodes
 * entities, and emits RFC-4180 CSV (header row + body). Useful for
 * pulling a table out of a web page or report into a spreadsheet.
 */
const htmlToCsv: Converter = {
  id: "html-to-csv",
  label: "HTML → CSV",
  fromMime: ["text/html", "application/xhtml+xml"],
  accept: [".html", ".htm", ".xhtml"],
  toMime: "text/csv",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const table = parseHtmlTable(await input.text());
      csv = rowsToCsv(tableToCsvRows(table));
      if (!csv.trim()) throw new Error("The HTML table produced no rows");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HTML table to CSV",
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

export default htmlToCsv;
