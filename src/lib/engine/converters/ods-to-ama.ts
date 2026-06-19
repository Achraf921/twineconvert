import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { renderCitationStyle } from "../util/csl-render";

/**
 * ODS → AMA. Reads the first sheet of a LibreOffice/OpenOffice Calc
 * spreadsheet of references (alias-aware headers), then renders a formatted
 * AMA reference list with citeproc-js and the official AMA CSL style.
 */
const odsToAma: Converter = {
  id: "ods-to-ama",
  label: "ODS → AMA",
  fromMime: ["application/vnd.oasis.opendocument.spreadsheet"],
  accept: [".ods"],
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
      out = await renderCitationStyle(citations, "ama", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ODS to AMA",
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

export default odsToAma;
