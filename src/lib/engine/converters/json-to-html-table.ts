import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { objectsToTable, buildHtmlTable } from "../util/tables";
import { parseJsonInput } from "../util/parse-json-input";

/**
 * JSON → HTML Table. Converts through the shared table model (headers + rows), so
 * columns and cell values carry across exactly.
 */
const jsonToHtmlTable: Converter = {
  id: "json-to-html-table",
  label: "JSON → HTML Table",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      const table = objectsToTable(parsed);
      out = buildHtmlTable(table);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to HTML Table",
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

export default jsonToHtmlTable;
