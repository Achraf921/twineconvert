import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { csvRowsToTable, buildHtmlTable } from "../util/tables";

/**
 * XLSX → HTML Table. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const xlsxToHtmlTable: Converter = {
  id: "xlsx-to-html-table",
  label: "XLSX → HTML Table",
  fromMime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  accept: [".xlsx"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await input.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error("XLSX has no sheets");
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, defval: "" });
      if (rows.length === 0) throw new Error("XLSX first sheet is empty");
      const table = csvRowsToTable(rows.map((r) => r.map((c) => String(c ?? ""))));
      out = buildHtmlTable(table);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XLSX to HTML Table",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default xlsxToHtmlTable;
