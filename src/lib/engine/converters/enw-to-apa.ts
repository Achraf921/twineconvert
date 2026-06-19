import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEnw } from "../util/enw";
import { renderCitationStyle } from "../util/csl-render";

/**
 * EndNote (.enw) → APA. Parses an EndNote export into the unified Citation
 * model, then renders a formatted APA reference list with citeproc-js and
 * the official APA CSL style. Lets EndNote users get a formatted APA
 * bibliography without opening EndNote. Plain text.
 */
const enwToApa: Converter = {
  id: "enw-to-apa",
  label: "EndNote → APA",
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
      out = await renderCitationStyle(citations, "apa", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote to APA",
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

export default enwToApa;
