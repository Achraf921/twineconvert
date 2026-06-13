import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseWos } from "../util/wos";
import { buildCslJson } from "../util/csl-json";

/**
 * Web of Science → CSL-JSON. Parses the Web of Science / ISI tagged export into the
 * unified Citation model, then writes CSL-JSON. The
 * format VOSviewer, bibliometrix, and CiteSpace read; import-only.
 */
const wosToCslJson: Converter = {
  id: "wos-to-csl-json",
  label: "Web of Science → CSL-JSON",
  fromMime: ["text/plain", "application/x-inst-for-scientific-info"],
  accept: [".txt", ".ciw", ".isi"],
  toMime: "application/vnd.citationstyles.csl+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseWos(text);
      if (citations.length === 0) throw new Error("No references found in the Web of Science file");
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Web of Science to CSL-JSON",
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

export default wosToCslJson;
