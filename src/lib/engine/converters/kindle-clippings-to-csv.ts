import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseKindleClippings } from "../util/kindle-clippings-parse";

const kindleClippingsToCsv: Converter = {
  id: "kindle-clippings-to-csv",
  label: "Kindle Clippings → CSV",
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
          book: c.book,
          author: c.author ?? "",
          type: c.type,
          page: c.page ?? "",
          location: c.location ?? "",
          addedAt: c.addedAt ?? "",
          text: c.text,
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

export default kindleClippingsToCsv;
