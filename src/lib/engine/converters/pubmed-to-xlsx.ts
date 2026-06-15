import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { citationsToCsv } from "../util/citations-to-csv";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * PubMed export (.txt / .nbib MEDLINE) → XLSX. Parses PubMed's "Save →
 * Format: PubMed" download and writes a spreadsheet with one row per
 * article (title, authors, year, journal, doi ...). The systematic-
 * review workflow: export a search from PubMed, screen it in Excel.
 */
const pubmedToXlsx: Converter = {
  id: "pubmed-to-xlsx",
  label: "PubMed → XLSX",
  fromMime: ["text/plain", "application/x-research-info-systems"],
  accept: [".txt", ".nbib"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No PubMed records found. This tool reads a PubMed/MEDLINE export (Save → Format: PubMed, or a .nbib file) with PMID-/TI-/AU- tagged lines.",
        );
      }
      const csv = await citationsToCsv(citations);
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PubMed export to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default pubmedToXlsx;
