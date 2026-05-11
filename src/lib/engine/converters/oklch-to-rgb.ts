import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { hexToRgb, formatRgb } from "../util/color-math";
import { parseColor, toHex } from "../util/modern-color";

const oklchToRgb: Converter = {
  id: "oklch-to-rgb",
  label: "OKLCH → RGB",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 2 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const lines = (await input.text())
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith(";"));
      if (lines.length === 0) throw new Error("No OKLCH colors found in input");
      // OKLCH → HEX → RGB pivots through the well-tested 8-bit path so we
      // get consistent rounding with our other RGB-emitting converters.
      out =
        lines
          .map((l) => formatRgb(hexToRgb(toHex(parseColor(l)))))
          .join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert OKLCH to RGB",
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

export default oklchToRgb;
