import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildBibtex } from "../util/bibtex";
import { parseRis } from "../util/ris";

const risToBibtex: Converter = {
  id: "ris-to-bibtex",
  label: "RIS → BibTeX",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bibtex: string;
    try {
      const text = await input.text();
      const citations = parseRis(text);
      if (citations.length === 0) throw new Error("No citations found in RIS file");
      bibtex = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to BibTeX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bibtex], { type: "application/x-bibtex" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default risToBibtex;
