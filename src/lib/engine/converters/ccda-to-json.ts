import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCcda } from "../util/ccda";

const ccdaToJson: Converter = {
  id: "ccda-to-json",
  label: "C-CDA → JSON",
  fromMime: ["application/cda+xml", "application/xml", "text/xml"],
  accept: [".xml", ".cda", ".ccda"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const doc = parseCcda(await input.text());
      out = JSON.stringify(doc, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert C-CDA to JSON",
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

export default ccdaToJson;
