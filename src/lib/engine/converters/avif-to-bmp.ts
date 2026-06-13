import type { Converter } from "../types";
import { encodeBmpFromImage } from "../util/bmp-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * AVIF → BMP.
 */
const avifToBmp: Converter = {
  id: "avif-to-bmp",
  label: "AVIF → BMP",
  fromMime: ["image/avif"],
  toMime: "image/bmp",
  accept: [".avif"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeBmpFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "bmp") };
  },
};

export default avifToBmp;
