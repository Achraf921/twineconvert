import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { citationsToCsv } from "../util/citations-to-csv";

/**
 * PubMed export (.txt / .nbib) → CSV. Parses PubMed's MEDLINE-tagged
 * download into a spreadsheet-friendly CSV (title, authors, year,
 * journal, doi ...). Built from the PostHog signal of a user dropping a
 * PubMed .txt onto csv-to-ris (which wants the opposite direction).
 */
const pubmedToCsv: Converter = {
  id: "pubmed-to-csv",
  label: "PubMed → CSV",
  fromMime: ["text/plain", "application/x-research-info-systems"],
  accept: [".txt", ".nbib"],
  toMime: "text/csv",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No PubMed records found. This tool reads a PubMed/MEDLINE export (Save → Format: PubMed, or a .nbib file) with PMID-/TI-/AU- tagged lines.",
        );
      }
      csv = await citationsToCsv(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PubMed export to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default pubmedToCsv;
