import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { renderCitationStyle } from "../util/csl-render";

/**
 * XLSX → APA. Reads the first sheet of an Excel spreadsheet of
 * references (alias-aware headers, so Scopus/Zotero exports saved as .xlsx
 * work), then renders a formatted APA (7th edition) reference list with citeproc-js
 * and the official APA CSL style. Plain text, one reference per paragraph.
 */
const xlsxToApa: Converter = {
  id: "xlsx-to-apa",
  label: "XLSX → APA",
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
      out = await renderCitationStyle(citations, "apa", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XLSX to APA",
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

export default xlsxToApa;
