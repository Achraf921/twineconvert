import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { formatCmyk, hexToRgb, parseHexLines, rgbToCmyk } from "../util/color-math";

const hexToCmykConverter: Converter = {
  id: "hex-to-cmyk",
  label: "HEX → CMYK",
  fromMime: ["text/plain"],
  accept: [".txt", ".hex"],
  toMime: "text/plain",
  maxFileSizeBytes: 2 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const hexes = parseHexLines(await input.text());
      if (hexes.length === 0) throw new Error("No hex colors found in input");
      out = hexes.map((h) => formatCmyk(rgbToCmyk(hexToRgb(h)))).join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HEX to CMYK",
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

export default hexToCmykConverter;
