import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { renderInTextCitations } from "../util/csl-render";

/**
 * CSL-JSON → APA in-text citations. Parses CSL-JSON into the unified Citation
 * model, then renders the APA IN-TEXT citation for each reference (e.g.
 * "(Smith & Doe, 2024)"), tab-paired with the source title so each one is easy
 * to match. The companion to the APA reference-list generator.
 */
const cslJsonToApaIntext: Converter = {
  id: "csl-json-to-apa-intext",
  label: "CSL-JSON → APA In-Text Citations",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseCslJson(await input.text());
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      const inText = await renderInTextCitations(citations, "apa");
      out = citations
        .map((c, i) => {
          const label = (c.title || c.authors?.[0] || "Untitled reference").trim();
          return inText[i] + "\t" + label;
        })
        .join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not generate APA in-text citations",
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

export default cslJsonToApaIntext;
