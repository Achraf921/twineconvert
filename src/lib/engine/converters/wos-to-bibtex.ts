import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseWos } from "../util/wos";
import { buildBibtex } from "../util/bibtex";

/**
 * Web of Science → BibTeX. Parses the Web of Science / ISI tagged export into the
 * unified Citation model, then writes BibTeX. The
 * format VOSviewer, bibliometrix, and CiteSpace read; import-only.
 */
const wosToBibtex: Converter = {
  id: "wos-to-bibtex",
  label: "Web of Science → BibTeX",
  fromMime: ["text/plain", "application/x-inst-for-scientific-info"],
  accept: [".txt", ".ciw", ".isi"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseWos(text);
      if (citations.length === 0) throw new Error("No references found in the Web of Science file");
      out = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Web of Science to BibTeX",
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

export default wosToBibtex;
