import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildMarkdownBibliography } from "../util/bibliography-render";

/**
 * RIS → a formatted Markdown reference list. Parses RIS into the unified Citation model, then renders each entry as a human-readable Markdown bibliography.
 */
const risToMarkdown: Converter = {
  id: "ris-to-markdown",
  label: "RIS → Markdown",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "text/markdown",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No references found in the RIS file");
      out = buildMarkdownBibliography(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to Markdown",
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

export default risToMarkdown;
