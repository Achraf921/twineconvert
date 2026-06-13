import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarkdownTable, tableToObjects } from "../util/tables";

/**
 * Markdown Table → JSON. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const markdownTableToJson: Converter = {
  id: "markdown-table-to-json",
  label: "Markdown Table → JSON",
  fromMime: ["text/markdown", "text/plain"],
  accept: [".md", ".markdown"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const table = parseMarkdownTable(await input.text());
      out = JSON.stringify(tableToObjects(table), null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Markdown Table to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default markdownTableToJson;
