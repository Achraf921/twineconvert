import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseHtmlTable, buildMarkdownTable } from "../util/tables";

/**
 * HTML Table → Markdown Table. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const htmlTableToMarkdownTable: Converter = {
  id: "html-table-to-markdown-table",
  label: "HTML Table → Markdown Table",
  fromMime: ["text/html", "text/plain"],
  accept: [".html", ".htm"],
  toMime: "text/markdown",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const table = parseHtmlTable(await input.text());
      out = buildMarkdownTable(table);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HTML Table to Markdown Table",
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

export default htmlTableToMarkdownTable;
