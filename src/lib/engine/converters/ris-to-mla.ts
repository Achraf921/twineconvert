import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { renderCitationStyle } from "../util/csl-render";

/**
 * RIS → MLA. Parses RIS into the unified Citation model, then
 * renders a formatted MLA (9th edition) reference list with citeproc-js and the
 * official MLA CSL style, so the output matches what Zotero or Mendeley
 * would produce. Plain text, one reference per paragraph.
 */
const risToMla: Converter = {
  id: "ris-to-mla",
  label: "RIS → MLA",
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
      out = await renderCitationStyle(citations, "mla", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to MLA",
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

export default risToMla;
