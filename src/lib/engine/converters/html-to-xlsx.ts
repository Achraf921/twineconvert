import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseHtmlTable, tableToCsvRows } from "../util/tables";
import { rowsToCsv } from "../util/rows-to-csv";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * HTML table → XLSX. Extracts the first <table>, decodes entities, and
 * writes a real .xlsx workbook via SheetJS (through the shared CSV→XLSX
 * helper). Drops a web-page table straight into Excel or Google Sheets.
 */
const htmlToXlsx: Converter = {
  id: "html-to-xlsx",
  label: "HTML → XLSX",
  fromMime: ["text/html", "application/xhtml+xml"],
  accept: [".html", ".htm", ".xhtml"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buffer: ArrayBuffer;
    try {
      const table = parseHtmlTable(await input.text());
      const csv = rowsToCsv(tableToCsvRows(table));
      if (!csv.trim()) throw new Error("The HTML table produced no rows");
      opts?.onProgress?.(0.5);
      buffer = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HTML table to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default htmlToXlsx;
