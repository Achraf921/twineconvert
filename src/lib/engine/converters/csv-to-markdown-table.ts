import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildMarkdownTable, csvRowsToTable } from "../util/tables";

const csvToMarkdownTable: Converter = {
  id: "csv-to-markdown-table",
  label: "CSV → Markdown table",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "text/markdown",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let md: string;
    try {
      const Papa = (await import("papaparse")).default;
      const parsed = Papa.parse<string[]>(await input.text(), { skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      }
      md = buildMarkdownTable(csvRowsToTable(parsed.data));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to Markdown table",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([md], { type: "text/markdown;charset=utf-8" }),
      filename: swapExtension(input.name, "md"),
    };
  },
};

export default csvToMarkdownTable;
