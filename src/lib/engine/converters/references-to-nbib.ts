import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { buildNbib } from "../util/ris";

/**
 * Reference list (plain text) → NBIB. Parses a
 * pasted bibliography (numbered IEEE or APA entries) into citations and
 * emits NBIB. Same demand signal as the rest of the
 * references-to-* family.
 */
const conv: Converter = {
  id: "references-to-nbib",
  label: "Reference List → NBIB",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No references recognized. This tool reads a plain-text reference list (numbered IEEE entries like [1] Author, \"Title,\" 2024, or APA entries like Author (2020). Title.). Make sure each reference has a title and year.",
        );
      }
      out = buildNbib(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "application/x-research-info-systems" }), filename: swapExtension(input.name, "nbib") };
  },
};

export default conv;
