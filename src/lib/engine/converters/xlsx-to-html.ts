import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import csvToHtml from "./csv-to-html";

/**
 * XLSX → HTML table. Reads the first sheet with SheetJS, then reuses the
 * csv-to-html renderer so the output is the same self-contained, styled
 * HTML page (escaped cell values) used across the tabular tools. Multi-
 * sheet workbooks export the first sheet only, matching xlsx-to-csv.
 */
const xlsxToHtml: Converter = {
  id: "xlsx-to-html",
  label: "XLSX → HTML",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  accept: [".xlsx"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await input.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("The spreadsheet has no sheets");
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (!csv.trim()) throw new Error("The first sheet is empty");
      opts?.onProgress?.(0.5);
      const csvFile = new File([csv], swapExtension(input.name, "csv"), {
        type: "text/csv",
      }) as unknown as File;
      html = await (await csvToHtml.convert(csvFile, undefined)).blob.text();
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XLSX to HTML",
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

export default xlsxToHtml;
