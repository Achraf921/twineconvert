import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { formatRgb, hslToRgb, parseHslLines } from "../util/color-math";

const hslToRgbConverter: Converter = {
  id: "hsl-to-rgb",
  label: "HSL → RGB",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 2 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const hsls = parseHslLines(await input.text());
      if (hsls.length === 0) throw new Error("No HSL colors found in input");
      out = hsls.map((hsl) => formatRgb(hslToRgb(hsl))).join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HSL to RGB",
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

export default hslToRgbConverter;
