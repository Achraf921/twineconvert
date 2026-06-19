import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseWos } from "../util/wos";
import { renderCitationStyle } from "../util/csl-render";

/**
 * Web of Science → MLA. Parses a Web of Science export into the unified Citation
 * model, then renders a formatted MLA reference list with citeproc-js and
 * the official MLA CSL style. Plain text, one reference per paragraph.
 */
const wosToMla: Converter = {
  id: "wos-to-mla",
  label: "Web of Science → MLA",
  fromMime: ["text/plain", "application/x-inst-for-scientific-info"],
  accept: [".txt", ".ciw", ".isi"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseWos(await input.text());
      if (citations.length === 0) throw new Error("No references found in the Web of Science export");
      out = await renderCitationStyle(citations, "mla", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Web of Science to MLA",
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

export default wosToMla;
