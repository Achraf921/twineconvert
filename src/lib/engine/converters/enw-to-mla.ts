import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEnw } from "../util/enw";
import { renderCitationStyle } from "../util/csl-render";

/**
 * EndNote (.enw) → MLA. Parses an EndNote export into the unified Citation
 * model, then renders a formatted MLA reference list with citeproc-js and
 * the official MLA CSL style. Lets EndNote users get a formatted MLA
 * bibliography without opening EndNote. Plain text.
 */
const enwToMla: Converter = {
  id: "enw-to-mla",
  label: "EndNote → MLA",
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
      out = await renderCitationStyle(citations, "mla", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote to MLA",
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

export default enwToMla;
