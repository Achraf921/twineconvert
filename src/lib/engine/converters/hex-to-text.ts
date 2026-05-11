import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { hexToText } from "../util/encoding";

const hexToTextConverter: Converter = {
  id: "hex-to-text",
  label: "Hex → Text",
  fromMime: ["text/plain"],
  accept: [".txt", ".hex"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = hexToText(await input.text());
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert hex to text",
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

export default hexToTextConverter;
