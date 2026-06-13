import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMods } from "../util/mods";
import { buildBibtex } from "../util/bibtex";

/**
 * MODS → BibTeX. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const modsToBibtex: Converter = {
  id: "mods-to-bibtex",
  label: "MODS → BibTeX",
  fromMime: ["application/mods+xml", "application/xml", "text/xml"],
  accept: [".xml", ".mods"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseMods(text);
      if (citations.length === 0) throw new Error("No references found in the MODS file");
      out = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MODS to BibTeX",
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

export default modsToBibtex;
