import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildEndnoteXml } from "../util/endnote-xml-build";

/**
 * PubMed export (.txt / .nbib MEDLINE) → EndNote XML. Parses
 * PubMed's "Save → Format: PubMed" download via the shared RIS/MEDLINE
 * parser and emits EndNote XML. Same demand signal as the rest of
 * the pubmed-to-* family: researchers exporting from PubMed.
 */
const conv: Converter = {
  id: "pubmed-to-endnote-xml",
  label: "PubMed → EndNote XML",
  fromMime: ["text/plain", "application/x-research-info-systems"],
  accept: [".txt", ".nbib"],
  toMime: "application/xml",
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
      out = buildEndnoteXml(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PubMed export",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "application/xml" }), filename: swapExtension(input.name, "xml") };
  },
};

export default conv;
