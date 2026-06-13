import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildMarkdownBibliography } from "../util/bibliography-render";

/**
 * NBIB → a formatted Markdown reference list. Parses NBIB into the unified Citation model, then renders each entry as a human-readable Markdown bibliography.
 */
const nbibToMarkdown: Converter = {
  id: "nbib-to-markdown",
  label: "NBIB → Markdown",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".nbib"],
  toMime: "text/markdown",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No references found in the NBIB file");
      out = buildMarkdownBibliography(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert NBIB to Markdown",
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

export default nbibToMarkdown;
