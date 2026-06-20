import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { sortBibtexEntries } from "../util/citation-sort";

/**
 * Alphabetize a BibTeX library by first-author surname, then year. Only the
 * @entry blocks are reordered, in place; preamble, @string, @preamble,
 * @comment and whitespace stay exactly where they are, so the result is
 * non-lossy and @string definitions remain before the entries that use them.
 */
const bibtexSort: Converter = {
  id: "bibtex-sort",
  label: "BibTeX Sort",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      if (!/@[A-Za-z]+\s*[{(]/.test(text)) {
        throw new Error("No BibTeX entries found.");
      }
      out = sortBibtexEntries(text);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not sort the BibTeX file",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-bibtex;charset=utf-8" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default bibtexSort;
