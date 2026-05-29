import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { buildRis } from "../util/ris";

const bibtexToRis: Converter = {
  id: "bibtex-to-ris",
  label: "BibTeX → RIS",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ris: string;
    try {
      const text = await input.text();
      const citations = parseBibtex(text);
      if (citations.length === 0) throw new Error("No citations found in BibTeX file");
      ris = buildRis(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert BibTeX to RIS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([ris], { type: "application/x-research-info-systems" }),
      filename: swapExtension(input.name, "ris"),
    };
  },
};

export default bibtexToRis;
