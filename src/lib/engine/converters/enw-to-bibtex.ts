import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEnw } from "../util/enw";
import { buildBibtex } from "../util/bibtex";

/**
 * EndNote ENW → BibTeX. Converts through the unified Citation model so every field
 * that round-trips across the citation family round-trips here too.
 */
const enwToBibtex: Converter = {
  id: "enw-to-bibtex",
  label: "EndNote ENW → BibTeX",
  fromMime: ["application/x-endnote-refer", "text/plain"],
  accept: [".enw"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseEnw(text);
      if (citations.length === 0) throw new Error("No references found in the ENW file");
      out = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote ENW to BibTeX",
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

export default enwToBibtex;
