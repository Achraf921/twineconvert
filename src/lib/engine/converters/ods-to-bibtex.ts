import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { buildBibtex } from "../util/bibtex";

/**
 * ODS → BibTeX. Reads the first sheet of the ODS spreadsheet of
 * references (columns like title, author, year, journal, doi), then
 * writes BibTeX via the unified Citation model. Column headers are
 * matched case- and alias-insensitively, so PubMed/Zotero/Excel exports
 * work without renaming columns.
 */
const odsToBibtex: Converter = {
  id: "ods-to-bibtex",
  label: "ODS → BibTeX",
  fromMime: ["application/vnd.oasis.opendocument.spreadsheet", "application/vnd.oasis.opendocument.spreadsheet-template"],
  accept: [".ods", ".ots"],
  toMime: "application/x-bibtex",
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
      out = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ODS to BibTeX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-bibtex;charset=utf-8" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default odsToBibtex;
