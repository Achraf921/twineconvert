import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildCslJson } from "../util/csl-json";

/**
 * PubMed export (.txt / .nbib MEDLINE) → CSL-JSON. Parses
 * PubMed's "Save → Format: PubMed" download via the shared RIS/MEDLINE
 * parser and emits CSL-JSON. Same demand signal as the rest of
 * the pubmed-to-* family: researchers exporting from PubMed.
 */
const conv: Converter = {
  id: "pubmed-to-csl-json",
  label: "PubMed → CSL-JSON",
  fromMime: ["text/plain", "application/x-research-info-systems"],
  accept: [".txt", ".nbib"],
  toMime: "application/vnd.citationstyles.csl+json",
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
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PubMed export",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "application/vnd.citationstyles.csl+json" }), filename: swapExtension(input.name, "json") };
  },
};

export default conv;
