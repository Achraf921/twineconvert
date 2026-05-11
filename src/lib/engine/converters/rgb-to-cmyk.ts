import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { formatCmyk, parseRgbLines, rgbToCmyk } from "../util/color-math";

const rgbToCmykConverter: Converter = {
  id: "rgb-to-cmyk",
  label: "RGB → CMYK",
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
      out = rgbs.map((rgb) => formatCmyk(rgbToCmyk(rgb))).join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RGB to CMYK",
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

export default rgbToCmykConverter;
