import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { buildMods } from "../util/mods";

/**
 * BibTeX → MODS. Converts through the unified Citation model so every field
 * carries across the citation family.
 */
const bibtexToMods: Converter = {
  id: "bibtex-to-mods",
  label: "BibTeX → MODS",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "application/mods+xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseBibtex(text);
      if (citations.length === 0) throw new Error("No references found in the BibTeX file");
      out = buildMods(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert BibTeX to MODS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/mods+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "xml"),
    };
  },
};

export default bibtexToMods;
