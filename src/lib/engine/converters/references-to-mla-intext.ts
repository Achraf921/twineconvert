import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { renderInTextCitations } from "../util/csl-render";

/**
 * Reference list (plain text) → MLA in-text citations. Parses a pasted
 * bibliography, then renders the MLA in-text citation for each entry
 * (e.g. "(Smith & Doe, 2024)"), tab-paired with the source title.
 */
const referencesToMlaIntext: Converter = {
  id: "references-to-mla-intext",
  label: "Reference List → MLA In-Text Citations",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) throw new Error("No references recognized. Paste a plain-text reference list (one per line or numbered).");
      const inText = await renderInTextCitations(citations, "mla");
      out = citations.map((c, i) => inText[i] + "\t" + (c.title || c.authors?.[0] || "Untitled reference").trim()).join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not generate MLA in-text citations", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "txt") };
  },
};

export default referencesToMlaIntext;
