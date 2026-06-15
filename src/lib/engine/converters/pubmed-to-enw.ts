import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildEnw } from "../util/enw";

/**
 * PubMed export (.txt / .nbib MEDLINE) → EndNote. Parses
 * PubMed's "Save → Format: PubMed" download via the shared RIS/MEDLINE
 * parser and emits EndNote. Same demand signal as the rest of
 * the pubmed-to-* family: researchers exporting from PubMed.
 */
const conv: Converter = {
  id: "pubmed-to-enw",
  label: "PubMed → EndNote",
  fromMime: ["text/plain", "application/x-research-info-systems"],
  accept: [".txt", ".nbib"],
  toMime: "application/x-endnote-refer",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No PubMed records found. This tool reads a PubMed/MEDLINE export (Save → Format: PubMed, or a .nbib file) with PMID-/TI-/AU- tagged lines.",
        );
      }
      out = buildEnw(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PubMed export",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "application/x-endnote-refer" }), filename: swapExtension(input.name, "enw") };
  },
};

export default conv;
