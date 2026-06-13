import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { buildMarkdownBibliography } from "../util/bibliography-render";

/**
 * CSL-JSON → a formatted Markdown reference list. Parses CSL-JSON into the unified Citation model, then renders each entry as a human-readable Markdown bibliography.
 */
const cslJsonToMarkdown: Converter = {
  id: "csl-json-to-markdown",
  label: "CSL-JSON → Markdown",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/markdown",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseCslJson(await input.text());
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      out = buildMarkdownBibliography(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to Markdown",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/markdown;charset=utf-8" }),
      filename: swapExtension(input.name, "md"),
    };
  },
};

export default cslJsonToMarkdown;
