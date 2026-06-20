import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { buildCff } from "../util/cff";

/**
 * CSL-JSON to CITATION.cff. Parses CSL-JSON and writes a Citation File Format
 * (CFF) document, the YAML file GitHub and Zenodo use for a repository "Cite
 * this software/dataset" widget. CFF describes one primary work, so the first
 * entry is used.
 */
const cslJsonToCff: Converter = {
  id: "csl-json-to-cff",
  label: "CSL-JSON to CFF",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseCslJson(await input.text());
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      out = await buildCff(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSL-JSON to CFF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-yaml;charset=utf-8" }),
      filename: swapExtension(input.name, "cff"),
    };
  },
};

export default cslJsonToCff;
