import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarkdownTable, buildHtmlTable } from "../util/tables";

/**
 * Markdown Table → HTML Table. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const markdownTableToHtmlTable: Converter = {
  id: "markdown-table-to-html-table",
  label: "Markdown Table → HTML Table",
  fromMime: ["text/markdown", "text/plain"],
  accept: [".md", ".markdown"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const table = parseMarkdownTable(await input.text());
      out = buildHtmlTable(table);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Markdown Table to HTML Table",
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

export default markdownTableToHtmlTable;
