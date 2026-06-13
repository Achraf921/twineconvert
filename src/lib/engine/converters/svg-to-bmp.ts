import type { Converter } from "../types";
import { encodeBmpFromImage } from "../util/bmp-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * SVG → BMP.
 * Standard uncompressed 24-bit bitmap output.
 */
const svgToBmp: Converter = {
  id: "svg-to-bmp",
  label: "SVG → BMP",
  fromMime: ["image/svg+xml"],
  toMime: "image/bmp",
  accept: [".svg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeBmpFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "bmp") };
  },
};

export default svgToBmp;
