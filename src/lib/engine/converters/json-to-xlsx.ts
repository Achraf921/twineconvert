import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON → XLSX. Reverse of xlsx-to-json. Accepts a JSON array of flat
 * objects; column headers come from the union of all object keys (in
 * insertion order, with new keys appended). Nested objects are
 * serialized as JSON strings rather than spread into multiple columns,
 * the lossy alternative would silently drop nested data.
 */
const jsonToXlsx: Converter = {
  id: "json-to-xlsx",
  label: "JSON → XLSX",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: Uint8Array;
    try {
      const XLSX = await import("xlsx");
      const text = await input.text();
      const parsed: unknown = JSON.parse(text);
      const rows = normalizeToRows(parsed);
      if (rows.length === 0) {
        throw new Error("JSON contains no data rows to write to a sheet");
      }
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
      const out = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
      bytes = out instanceof Uint8Array ? out : new Uint8Array(out as ArrayBuffer);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not write JSON to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([new Uint8Array(bytes)], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

/**
 * Normalize the parsed JSON into a flat array of row records.
 *   - [{a:1,b:2}, ...]            -> as-is
 *   - { rows: [{a:1,b:2}, ...] }  -> use rows
 *   - { data: [{a:1,b:2}, ...] }  -> use data
 *   - [[1,2,3], [4,5,6]]          -> wrap as r1/r2/r3 columns
 *
 * Anything else throws.
 */
function normalizeToRows(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return [];
    if (
      typeof parsed[0] === "object" &&
      parsed[0] !== null &&
      !Array.isArray(parsed[0])
    ) {
      return parsed as Record<string, unknown>[];
    }
    if (Array.isArray(parsed[0])) {
      return (parsed as unknown[][]).map((row, i) => {
        const rec: Record<string, unknown> = {};
        row.forEach((cell, j) => {
          rec[`column_${j + 1}`] = cell;
        });
        return rec;
      });
    }
    // Array of primitives: single column
    return (parsed as unknown[]).map((v) => ({ value: v }));
  }
  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.rows)) return normalizeToRows(obj.rows);
    if (Array.isArray(obj.data)) return normalizeToRows(obj.data);
    // Single object becomes a single-row sheet
    return [obj];
  }
  throw new Error("JSON must be an array of objects or an object with `rows`/`data` array");
}

export default jsonToXlsx;
