import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildRis, parseRis } from "../util/ris";

/**
 * PubMed export (.txt / .nbib) → RIS. PubMed's "Save → Format: PubMed"
 * produces a MEDLINE-tagged .txt (PMID-, TI-, AU-, AID- ...), which our
 * RIS parser already understands. Built from a PostHog signal: a user
 * dropped a "pubmed-...set.txt" onto csv-to-ris and failed because that
 * tool only takes CSV. This route accepts the real PubMed download.
 */
const pubmedToRis: Converter = {
  id: "pubmed-to-ris",
  label: "PubMed → RIS",
  fromMime: ["text/plain", "application/x-research-info-systems"],
  accept: [".txt", ".nbib"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ris: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No PubMed records found. This tool reads a PubMed/MEDLINE export (Save → Format: PubMed, or a .nbib file) with PMID-/TI-/AU- tagged lines.",
        );
      }
      ris = buildRis(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PubMed export to RIS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([ris], { type: "application/x-research-info-systems" }),
      filename: swapExtension(input.name, "ris"),
    };
  },
};

export default pubmedToRis;
