import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseKindleClippings } from "../util/kindle-clippings-parse";

const kindleClippingsToJson: Converter = {
  id: "kindle-clippings-to-json",
  label: "Kindle Clippings → JSON",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const text = await input.text();
      json = JSON.stringify(parseKindleClippings(text), null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse Kindle clippings",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default kindleClippingsToJson;
