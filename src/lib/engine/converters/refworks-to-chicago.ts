import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRefworks } from "../util/refworks";
import { renderCitationStyle } from "../util/csl-render";

/**
 * RefWorks → Chicago. Parses a RefWorks export into the unified Citation
 * model, then renders a formatted Chicago reference list with citeproc-js and
 * the official Chicago CSL style. Plain text, one reference per paragraph.
 */
const refworksToChicago: Converter = {
  id: "refworks-to-chicago",
  label: "RefWorks → Chicago",
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
      out = await renderCitationStyle(citations, "chicago", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RefWorks to Chicago",
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

export default refworksToChicago;
