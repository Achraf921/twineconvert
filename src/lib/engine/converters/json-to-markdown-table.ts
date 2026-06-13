import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { objectsToTable, buildMarkdownTable } from "../util/tables";

/**
 * JSON → Markdown Table. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const jsonToMarkdownTable: Converter = {
  id: "json-to-markdown-table",
  label: "JSON → Markdown Table",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/markdown",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = JSON.parse(await input.text());
      const table = objectsToTable(parsed);
      out = buildMarkdownTable(table);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to Markdown Table",
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

export default jsonToMarkdownTable;
