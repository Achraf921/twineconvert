import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson, buildCslJson } from "../util/csl-json";
import { dedupeCitations } from "../util/citation-dedupe";

/**
 * CSL-JSON de-duplicate. Parses a CSL-JSON library, removes duplicate
 * references (same DOI, or same title + year when there is no DOI), and writes
 * CSL-JSON back. Useful after merging exports from several databases.
 */
const cslJsonDedupe: Converter = {
  id: "csl-json-dedupe",
  label: "CSL-JSON Deduplicate",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const text = await input.text();
    let out: string;
    try {
      const citations = parseCslJson(text);
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      const { citations: deduped } = dedupeCitations(citations);
      out = buildCslJson(deduped);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not deduplicate the CSL-JSON file",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default cslJsonDedupe;
