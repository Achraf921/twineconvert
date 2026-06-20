import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractIsbns } from "../util/extract-identifiers";

/**
 * Extract ISBNs from pasted text. Scans a reference list, catalog page or any
 * text blob and returns the unique ISBN-10/13 values, one per line, in the
 * order they first appear. Each candidate is validated by its check digit, so
 * phone numbers and random digit runs are not returned.
 */
const textToIsbns: Converter = {
  id: "text-to-isbns",
  label: "Text → ISBNs",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const ids = extractIsbns(await input.text());
      if (ids.length === 0) {
        throw new Error(
          "No valid ISBNs found in the text. ISBNs must be a labelled ISBN or a 978/979 number with a correct check digit.",
        );
      }
      out = ids.join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not extract ISBNs",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default textToIsbns;
