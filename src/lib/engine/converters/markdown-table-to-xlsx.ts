import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarkdownTable, tableToCsvRows } from "../util/tables";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * Markdown Table → XLSX. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const markdownTableToXlsx: Converter = {
  id: "markdown-table-to-xlsx",
  label: "Markdown Table → XLSX",
  fromMime: ["text/markdown", "text/plain"],
  accept: [".md", ".markdown"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const table = parseMarkdownTable(await input.text());
      const Papa = (await import("papaparse")).default;
      const csv = Papa.unparse(tableToCsvRows(table));
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Markdown Table to XLSX",
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

export default markdownTableToXlsx;
