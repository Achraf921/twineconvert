import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { textToHex } from "../util/encoding";

const textToHexConverter: Converter = {
  id: "text-to-hex",
  label: "Text → Hex",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = textToHex(await input.text());
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert text to hex",
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

export default textToHexConverter;
