import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseKindleClippings } from "../util/kindle-clippings-parse";

/**
 * Notion-import CSV. Differences from the generic CSV: column names are
 * Title-Cased (Notion uses these as property names verbatim), Tags column
 * uses comma-joined values (Notion's multi-select expects this), and
 * Highlight is broken into "Type" + "Highlight" columns so users can
 * filter notes/highlights/bookmarks separately in their Notion database.
 *
 * Workflow: user creates an empty Notion database, then File → Import →
 * CSV with this output. Each row becomes a Notion page.
 */
const kindleClippingsToNotionCsv: Converter = {
  id: "kindle-clippings-to-notion-csv",
  label: "Kindle Clippings → Notion (.csv)",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const text = await input.text();
      const clippings = parseKindleClippings(text);
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        clippings.map((c) => ({
          Name: c.text ? c.text.slice(0, 80) : `${c.type} from ${c.book}`,
          Book: c.book,
          Author: c.author ?? "",
          Type: c.type.charAt(0).toUpperCase() + c.type.slice(1),
          Highlight: c.text,
          Location: c.location ?? "",
          Page: c.page ?? "",
          "Added On": c.addedAt ?? "",
          Tags: c.author ? `${c.book}, ${c.author}` : c.book,
        })),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse Kindle clippings",
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

export default kindleClippingsToNotionCsv;
