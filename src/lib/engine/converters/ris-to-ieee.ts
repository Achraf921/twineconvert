import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { renderCitationStyle } from "../util/csl-render";

/**
 * RIS → IEEE. Parses RIS into the unified Citation model, then
 * renders a formatted IEEE reference list with citeproc-js and the
 * official IEEE CSL style, matching what Zotero or Mendeley produce.
 * Plain text, one reference per paragraph.
 */
const risToIeee: Converter = {
  id: "ris-to-ieee",
  label: "RIS → IEEE",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No references found in the RIS file");
      out = await renderCitationStyle(citations, "ieee", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to IEEE",
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

export default risToIeee;
