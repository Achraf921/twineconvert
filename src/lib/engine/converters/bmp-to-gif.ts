import type { Converter } from "../types";
import { encodeGifFromImage } from "../util/gif-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * BMP → GIF.
 * Single-frame static output (animated sources export the first frame).
 */
const bmpToGif: Converter = {
  id: "bmp-to-gif",
  label: "BMP → GIF",
  fromMime: ["image/bmp", "image/x-bmp"],
  toMime: "image/gif",
  accept: [".bmp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeGifFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default bmpToGif;
