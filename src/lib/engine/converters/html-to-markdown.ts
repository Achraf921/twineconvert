import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * HTML → Markdown via turndown. Targets the "I have an HTML email or
 * a web article and I want to import it into Obsidian/Notion/whatever"
 * use case. Output uses GFM-style tables (Turndown's default), ATX-style
 * headers (`#`), and double-asterisk emphasis to round-trip cleanly
 * through markdown-to-html.
 */
const htmlToMarkdown: Converter = {
  id: "html-to-markdown",
  label: "HTML → Markdown",
  fromMime: ["text/html", "application/xhtml+xml", "text/plain"],
  accept: [".html", ".htm", ".xhtml"],
  toMime: "text/markdown",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let md: string;
    try {
      const TurndownService = (await import("turndown")).default;
      const turndown = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        bulletListMarker: "-",
        emDelimiter: "*",
        strongDelimiter: "**",
      });
      md = turndown.turndown(await input.text());
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse HTML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([md], { type: "text/markdown;charset=utf-8" }),
      filename: swapExtension(input.name, "md"),
    };
  },
};

export default htmlToMarkdown;
