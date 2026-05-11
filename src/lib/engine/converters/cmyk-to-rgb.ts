import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { cmykToRgb, formatRgb, parseCmykLines } from "../util/color-math";

const cmykToRgbConverter: Converter = {
  id: "cmyk-to-rgb",
  label: "CMYK → RGB",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 2 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cmyks = parseCmykLines(await input.text());
      if (cmyks.length === 0) throw new Error("No CMYK colors found in input");
      out = cmyks.map((c) => formatRgb(cmykToRgb(c))).join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CMYK to RGB",
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

export default cmykToRgbConverter;
