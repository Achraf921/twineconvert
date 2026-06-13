import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseHtmlTable, tableToObjects } from "../util/tables";

/**
 * HTML Table → JSON. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const htmlTableToJson: Converter = {
  id: "html-table-to-json",
  label: "HTML Table → JSON",
  fromMime: ["text/html", "text/plain"],
  accept: [".html", ".htm"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const table = parseHtmlTable(await input.text());
      out = JSON.stringify(tableToObjects(table), null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HTML Table to JSON",
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

export default htmlTableToJson;
