import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildCslJson } from "../util/csl-json";

/**
 * NBIB → CSL-JSON. Converts via the unified Citation model: parse NBIB
 * into the shared bibliographic record, then write CSL-JSON. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const nbibToCslJson: Converter = {
  id: "nbib-to-csl-json",
  label: "NBIB → CSL-JSON",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".nbib"],
  toMime: "application/vnd.citationstyles.csl+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseRis(text);
      if (citations.length === 0) throw new Error("No references found in the NBIB file");
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert NBIB to CSL-JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/vnd.citationstyles.csl+json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default nbibToCslJson;
