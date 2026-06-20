import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { renderInTextCitations } from "../util/csl-render";

/**
 * RIS → MLA in-text citations. Parses RIS into the unified Citation
 * model, then renders the MLA IN-TEXT citation for each reference (e.g.
 * "(Smith & Doe, 2024)"), tab-paired with the source title so each one is easy
 * to match. The companion to the MLA reference-list generator.
 */
const risToMlaIntext: Converter = {
  id: "ris-to-mla-intext",
  label: "RIS → MLA In-Text Citations",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No references found in the RIS file");
      const inText = await renderInTextCitations(citations, "mla");
      out = citations
        .map((c, i) => {
          const label = (c.title || c.authors?.[0] || "Untitled reference").trim();
          return inText[i] + "\t" + label;
        })
        .join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not generate MLA in-text citations",
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

export default risToMlaIntext;
