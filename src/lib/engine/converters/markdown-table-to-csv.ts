import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarkdownTable, tableToCsvRows } from "../util/tables";

const markdownTableToCsv: Converter = {
  id: "markdown-table-to-csv",
  label: "Markdown table → CSV",
  fromMime: ["text/markdown", "text/plain"],
  accept: [".md", ".markdown"],
  toMime: "text/csv",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const table = parseMarkdownTable(await input.text());
      csv = Papa.unparse(tableToCsvRows(table));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Markdown table to CSV",
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

export default markdownTableToCsv;
