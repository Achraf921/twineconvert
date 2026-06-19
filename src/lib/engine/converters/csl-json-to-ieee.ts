import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { renderCitationStyle } from "../util/csl-render";

/**
 * CSL-JSON → IEEE. Parses CSL-JSON into the unified Citation model, then
 * renders a formatted IEEE reference list with citeproc-js and the
 * official IEEE CSL style, matching what Zotero or Mendeley produce.
 * Plain text, one reference per paragraph.
 */
const cslJsonToIeee: Converter = {
  id: "csl-json-to-ieee",
  label: "CSL-JSON → IEEE",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseCslJson(await input.text());
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      out = await renderCitationStyle(citations, "ieee", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to IEEE",
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

export default cslJsonToIeee;
