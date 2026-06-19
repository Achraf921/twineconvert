import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { renderCitationStyle } from "../util/csl-render";

/**
 * Reference list (plain text) → APA. Parses a pasted bibliography
 * (numbered IEEE or APA entries) into the unified Citation model, then
 * re-renders it as a clean APA (7th edition) reference list with citeproc-js and the
 * official APA CSL style. Best-effort: free-text parsing is fuzzy, so
 * confirm the result, but it reformats a rough list into APA in one step.
 */
const referencesToApa: Converter = {
  id: "references-to-apa",
  label: "Reference List → APA",
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
        throw new Error(
          "No references recognized. Paste a plain-text reference list (numbered IEEE entries like [1] Author, \"Title,\" 2024, or APA entries like Author (2020). Title. Journal.). Each reference needs at least a title and a year.",
        );
      }
      out = await renderCitationStyle(citations, "apa", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references to APA",
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

export default referencesToApa;
