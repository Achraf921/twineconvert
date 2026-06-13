import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { buildRis } from "../util/ris";

/**
 * Reference list (plain text) → RIS. Parses a pasted bibliography
 * (numbered IEEE or APA style) into citations and emits RIS for import
 * into Zotero, Mendeley, EndNote, etc. Built from a real PostHog signal:
 * users were dropping reference lists onto csv-to-ris and failing.
 */
const referencesToRis: Converter = {
  id: "references-to-ris",
  label: "Reference List → RIS",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ris: string;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No references recognized. This tool reads a plain-text reference list (numbered IEEE entries like [1] Author, \"Title,\" 2024, or APA entries like Author (2020). Title.). Make sure each reference has a title and year.",
        );
      }
      ris = buildRis(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references to RIS",
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

export default referencesToRis;
