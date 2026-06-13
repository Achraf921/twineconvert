import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { buildHtmlBibliography } from "../util/bibliography-render";

/**
 * CSL-JSON → a formatted HTML reference list. Parses CSL-JSON into the unified Citation model, then renders each entry as a human-readable HTML bibliography.
 */
const cslJsonToHtml: Converter = {
  id: "csl-json-to-html",
  label: "CSL-JSON → HTML",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/html",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseCslJson(await input.text());
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      out = buildHtmlBibliography(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to HTML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default cslJsonToHtml;
