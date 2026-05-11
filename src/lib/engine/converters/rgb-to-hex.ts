import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRgbLines, rgbToHex } from "../util/color-math";

const rgbToHexConverter: Converter = {
  id: "rgb-to-hex",
  label: "RGB → HEX",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 2 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const rgbs = parseRgbLines(await input.text());
      if (rgbs.length === 0) throw new Error("No RGB colors found in input");
      out = rgbs.map((rgb) => rgbToHex(rgb)).join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RGB to HEX",
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

export default rgbToHexConverter;
