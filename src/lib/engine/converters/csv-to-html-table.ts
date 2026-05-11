import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildHtmlTable, csvRowsToTable } from "../util/tables";

const csvToHtmlTable: Converter = {
  id: "csv-to-html-table",
  label: "CSV → HTML table",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "text/html",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const Papa = (await import("papaparse")).default;
      const parsed = Papa.parse<string[]>(await input.text(), { skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      }
      html = buildHtmlTable(csvRowsToTable(parsed.data));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to HTML table",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([html], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default csvToHtmlTable;
