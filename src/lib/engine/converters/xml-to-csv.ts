import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Generic XML → CSV. Finds the deepest set of "repeated sibling
 * elements" in the document (the rows) and flattens each element's
 * scalar children and attributes into a row, with the union of all
 * keys across rows as the header.
 *
 * Works on the common shapes: <orders><order><id/><total/></order>...,
 * RSS-ish <items><item>..., generic <records><record>... Anything more
 * exotic (deep nesting, mixed-content text) is not the target use case,
 * the user should pre-shape with their own XSLT first.
 */
const xmlToCsv: Converter = {
  id: "xml-to-csv",
  label: "XML → CSV",
  fromMime: ["application/xml", "text/xml", "text/plain"],
  accept: [".xml"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const { XMLParser } = await import("fast-xml-parser");
      const Papa = (await import("papaparse")).default;
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        // Always emit arrays for repeated nodes so we do not have to
        // distinguish single-vs-array at the row-detection step.
        allowBooleanAttributes: true,
        trimValues: true,
      });
      const tree = parser.parse(await input.text());
      const rows = findRepeatedRows(tree);
      if (rows.length === 0) {
        throw new Error(
          "Could not find a repeating element in the XML. CSV needs a list of similar records, e.g. <orders><order>...</order><order>...</order></orders>. Open the file and confirm it has repeated child elements at some level.",
        );
      }
      const flatRows = rows.map(flatten);
      const headers = Array.from(
        flatRows.reduce<Set<string>>((set, r) => {
          for (const k of Object.keys(r)) set.add(k);
          return set;
        }, new Set()),
      );
      csv = Papa.unparse(flatRows, { columns: headers });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert XML to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

/**
 * Walk the parsed XML tree breadth-first; the first node we find that
 * holds an array of >=2 sibling objects under one key is treated as
 * the row collection. That covers the standard "list of records"
 * shapes without needing user configuration.
 */
function findRepeatedRows(tree: unknown): Record<string, unknown>[] {
  const queue: unknown[] = [tree];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    for (const [, value] of Object.entries(node)) {
      if (
        Array.isArray(value) &&
        value.length >= 2 &&
        value.every((v) => v && typeof v === "object")
      ) {
        return value as Record<string, unknown>[];
      }
      if (value && typeof value === "object") queue.push(value);
    }
  }
  return [];
}

/**
 * Flatten one row: scalar leaves become cells; nested objects are
 * JSON-stringified into a single cell so the row stays one CSV line
 * (matches Papa Parse's `unparse` default for nested data).
 */
function flatten(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v == null) {
      out[k] = "";
    } else if (typeof v === "object") {
      out[k] = JSON.stringify(v);
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

export default xmlToCsv;
