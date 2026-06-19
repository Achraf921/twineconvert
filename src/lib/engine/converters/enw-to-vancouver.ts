import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEnw } from "../util/enw";
import { renderCitationStyle } from "../util/csl-render";

/**
 * EndNote (.enw) → Vancouver. Parses an EndNote export into the unified Citation
 * model, then renders a formatted Vancouver reference list with citeproc-js and
 * the official Vancouver CSL style. Lets EndNote users get a formatted Vancouver
 * bibliography without opening EndNote. Plain text.
 */
const enwToVancouver: Converter = {
  id: "enw-to-vancouver",
  label: "EndNote → Vancouver",
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
      out = await renderCitationStyle(citations, "vancouver", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote to Vancouver",
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

export default enwToVancouver;
