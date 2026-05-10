import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseKindleClippings } from "../util/kindle-clippings-parse";

/**
 * Readwise-flavored CSV. Readwise's CSV importer expects these column
 * names exactly: Highlight, Title, Author, Note, Location, Date.
 * Reference: https://readwise.io/import_csv
 *
 * Mapping caveats:
 *   - "Note" in Readwise = your annotation, NOT the highlight body.
 *     Kindle exports both highlights and notes as separate entries ,
 *     we map the body of "note" type clippings to the Note column,
 *     leaving Highlight blank for those rows. Highlights map to the
 *     Highlight column with empty Note. This keeps Readwise's data model intact.
 */
const kindleClippingsToReadwiseCsv: Converter = {
  id: "kindle-clippings-to-readwise-csv",
  label: "Kindle Clippings → Readwise (.csv)",
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
        clippings
          .filter((c) => c.type !== "bookmark") // Readwise has no bookmarks concept
          .map((c) => ({
            Highlight: c.type === "highlight" ? c.text : "",
            Title: c.book,
            Author: c.author ?? "",
            Note: c.type === "note" ? c.text : "",
            Location: c.location ?? "",
            Date: c.addedAt ?? "",
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

export default kindleClippingsToReadwiseCsv;
