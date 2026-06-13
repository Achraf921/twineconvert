import type { Converter } from "../types";
import { encodeBmpFromImage } from "../util/bmp-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * WebP → BMP.
 */
const webpToBmp: Converter = {
  id: "webp-to-bmp",
  label: "WebP → BMP",
  fromMime: ["image/webp"],
  toMime: "image/bmp",
  accept: [".webp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeBmpFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "bmp") };
  },
};

export default webpToBmp;
