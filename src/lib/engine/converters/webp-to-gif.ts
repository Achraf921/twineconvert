import type { Converter } from "../types";
import { encodeGifFromImage } from "../util/gif-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * WebP → GIF.
 * Single-frame static output (animated sources export the first frame).
 */
const webpToGif: Converter = {
  id: "webp-to-gif",
  label: "WebP → GIF",
  fromMime: ["image/webp"],
  toMime: "image/gif",
  accept: [".webp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeGifFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default webpToGif;
