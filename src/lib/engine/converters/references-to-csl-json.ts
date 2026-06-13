import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { buildCslJson } from "../util/csl-json";

/**
 * Reference list (plain text) → CSL-JSON. Parses a pasted bibliography
 * (numbered IEEE or APA style) into citations and emits CSL-JSON, the
 * native format Zotero and many web tools ingest. Same PostHog-driven
 * need as references-to-ris / references-to-bibtex.
 */
const referencesToCslJson: Converter = {
  id: "references-to-csl-json",
  label: "Reference List → CSL-JSON",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "application/vnd.citationstyles.csl+json",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No references recognized. This tool reads a plain-text reference list (numbered IEEE entries like [1] Author, \"Title,\" 2024, or APA entries like Author (2020). Title.). Make sure each reference has a title and year.",
        );
      }
      json = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references to CSL-JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/vnd.citationstyles.csl+json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default referencesToCslJson;
