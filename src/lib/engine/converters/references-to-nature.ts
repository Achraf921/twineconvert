import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { renderCitationStyle } from "../util/csl-render";

/**
 * Reference list (plain text) → Nature. Parses a pasted bibliography into the
 * unified Citation model, then re-renders it as a clean Nature journal style reference list
 * with citeproc-js and the official Nature CSL style. Best-effort parsing.
 */
const referencesToNature: Converter = {
  id: "references-to-nature",
  label: "Reference List → Nature",
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
      out = await renderCitationStyle(citations, "nature", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references to Nature",
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

export default referencesToNature;
