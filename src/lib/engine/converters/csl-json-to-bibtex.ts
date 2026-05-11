import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildBibtex } from "../util/bibtex";
import { parseCslJson } from "../util/csl-json";

const cslJsonToBibtex: Converter = {
  id: "csl-json-to-bibtex",
  label: "CSL-JSON → BibTeX",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseCslJson(await input.text());
      if (citations.length === 0) throw new Error("CSL-JSON has no entries");
      out = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to BibTeX",
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

export default cslJsonToBibtex;
