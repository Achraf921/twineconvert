import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { renderCitationStyle } from "../util/csl-render";

/**
 * Reference list (plain text) → ACS. Parses a pasted bibliography into the
 * unified Citation model, then re-renders it as a clean ACS (American Chemical Society) reference list
 * with citeproc-js and the official ACS CSL style. Best-effort parsing.
 */
const referencesToAcs: Converter = {
  id: "references-to-acs",
  label: "Reference List → ACS",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) {
        throw new Error("No references recognized. Paste a plain-text reference list (one reference per line or numbered entries); each needs at least a title and a year.");
      }
      out = await renderCitationStyle(citations, "acs", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references to ACS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default referencesToAcs;
