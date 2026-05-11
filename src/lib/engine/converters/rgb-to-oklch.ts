import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRgbLines } from "../util/color-math";
import { parseColor, toOklch } from "../util/modern-color";

const rgbToOklch: Converter = {
  id: "rgb-to-oklch",
  label: "RGB → OKLCH",
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
      out =
        rgbs
          .map((rgb) => toOklch(parseColor(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)))
          .join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RGB to OKLCH",
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

export default rgbToOklch;
