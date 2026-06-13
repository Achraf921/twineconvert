import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { csvRowsToTable, buildMarkdownTable } from "../util/tables";

/**
 * XLSX → Markdown Table. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const xlsxToMarkdownTable: Converter = {
  id: "xlsx-to-markdown-table",
  label: "XLSX → Markdown Table",
  fromMime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  accept: [".xlsx"],
  toMime: "text/markdown",
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
      out = buildMarkdownTable(table);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XLSX to Markdown Table",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/markdown;charset=utf-8" }),
      filename: swapExtension(input.name, "md"),
    };
  },
};

export default xlsxToMarkdownTable;
