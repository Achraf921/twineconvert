import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { renderCitationStyle } from "../util/csl-render";

/**
 * XLSX → MLA. Reads the first sheet of an Excel spreadsheet of
 * references (alias-aware headers, so Scopus/Zotero exports saved as .xlsx
 * work), then renders a formatted MLA (9th edition) reference list with citeproc-js
 * and the official MLA CSL style. Plain text, one reference per paragraph.
 */
const xlsxToMla: Converter = {
  id: "xlsx-to-mla",
  label: "XLSX → MLA",
  fromMime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  accept: [".xlsx"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await input.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error("The spreadsheet has no sheets.");
      const csv = XLSX.utils.sheet_to_csv(sheet);
      const citations = await citationsFromCsv(csv);
      if (citations.length === 0) {
        throw new Error("No references found in the spreadsheet. Expected a header row with columns like title, author, year, doi.");
      }
      out = await renderCitationStyle(citations, "mla", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XLSX to MLA",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default xlsxToMla;
