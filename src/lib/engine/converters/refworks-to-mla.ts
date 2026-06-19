import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRefworks } from "../util/refworks";
import { renderCitationStyle } from "../util/csl-render";

/**
 * RefWorks → MLA. Parses a RefWorks export into the unified Citation
 * model, then renders a formatted MLA reference list with citeproc-js and
 * the official MLA CSL style. Plain text, one reference per paragraph.
 */
const refworksToMla: Converter = {
  id: "refworks-to-mla",
  label: "RefWorks → MLA",
  fromMime: ["text/plain", "text/x-refworks"],
  accept: [".txt", ".rwt"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRefworks(await input.text());
      if (citations.length === 0) throw new Error("No references found in the RefWorks file");
      out = await renderCitationStyle(citations, "mla", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RefWorks to MLA",
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

export default refworksToMla;
