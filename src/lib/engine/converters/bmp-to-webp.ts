import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

/**
 * BMP → WebP.
 * WebP keeps alpha, so transparency in the source survives.
 */
const bmpToWebp: Converter = {
  id: "bmp-to-webp",
  label: "BMP → WebP",
  fromMime: ["image/bmp", "image/x-bmp"],
  toMime: "image/webp",
  accept: [".bmp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, {
      toMime: "image/webp",
      quality: opts?.quality ?? 0.9,
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "webp") };
  },
};

export default bmpToWebp;
