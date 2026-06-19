import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { renderCitationStyle } from "../util/csl-render";

/**
 * CSL-JSON → Chicago. Parses CSL-JSON into the unified Citation model, then
 * renders a formatted Chicago (author-date) reference list with citeproc-js and the
 * official Chicago CSL style, so the output matches what Zotero or Mendeley
 * would produce. Plain text, one reference per paragraph.
 */
const cslJsonToChicago: Converter = {
  id: "csl-json-to-chicago",
  label: "CSL-JSON → Chicago",
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
      out = await renderCitationStyle(citations, "chicago", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to Chicago",
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

export default cslJsonToChicago;
