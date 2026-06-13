import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { buildCslJson } from "../util/csl-json";

/**
 * RIS → CSL-JSON. Converts via the unified Citation model: parse RIS
 * into the shared bibliographic record, then write CSL-JSON. Same
 * parsers/writers used by the rest of the citation family, so every
 * field that round-trips through one pair round-trips through this one.
 */
const risToCslJson: Converter = {
  id: "ris-to-csl-json",
  label: "RIS → CSL-JSON",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "application/vnd.citationstyles.csl+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseRis(text);
      if (citations.length === 0) throw new Error("No references found in the RIS file");
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to CSL-JSON",
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

export default risToCslJson;
