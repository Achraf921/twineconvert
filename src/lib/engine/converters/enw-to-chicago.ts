import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEnw } from "../util/enw";
import { renderCitationStyle } from "../util/csl-render";

/**
 * EndNote (.enw) → Chicago. Parses an EndNote export into the unified Citation
 * model, then renders a formatted Chicago reference list with citeproc-js and
 * the official Chicago CSL style. Lets EndNote users get a formatted Chicago
 * bibliography without opening EndNote. Plain text.
 */
const enwToChicago: Converter = {
  id: "enw-to-chicago",
  label: "EndNote → Chicago",
  fromMime: ["application/x-endnote-refer", "text/plain"],
  accept: [".enw"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseEnw(await input.text());
      if (citations.length === 0) throw new Error("No references found in the EndNote (.enw) file");
      out = await renderCitationStyle(citations, "chicago", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote to Chicago",
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

export default enwToChicago;
