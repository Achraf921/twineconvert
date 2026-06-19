import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRefworks } from "../util/refworks";
import { renderCitationStyle } from "../util/csl-render";

/**
 * RefWorks → ACS. Parses a RefWorks export into the unified Citation
 * model, then renders a formatted ACS reference list with citeproc-js and
 * the official ACS CSL style. Plain text, one reference per paragraph.
 */
const refworksToAcs: Converter = {
  id: "refworks-to-acs",
  label: "RefWorks → ACS",
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
      out = await renderCitationStyle(citations, "acs", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RefWorks to ACS",
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

export default refworksToAcs;
