import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { buildCslJson } from "../util/csl-json";

/**
 * XLSX → CSL-JSON. Reads the first sheet of the XLSX spreadsheet of
 * references (columns like title, author, year, journal, doi), then
 * writes CSL-JSON via the unified Citation model. Column headers are
 * matched case- and alias-insensitively, so PubMed/Zotero/Excel exports
 * work without renaming columns.
 */
const xlsxToCslJson: Converter = {
  id: "xlsx-to-csl-json",
  label: "XLSX → CSL-JSON",
  fromMime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  accept: [".xlsx"],
  toMime: "application/vnd.citationstyles.csl+json",
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
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XLSX to CSL-JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/vnd.citationstyles.csl+json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default xlsxToCslJson;
