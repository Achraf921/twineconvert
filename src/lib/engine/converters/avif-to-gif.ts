import type { Converter } from "../types";
import { encodeGifFromImage } from "../util/gif-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * AVIF → GIF.
 * Single-frame static output (animated sources export the first frame).
 */
const avifToGif: Converter = {
  id: "avif-to-gif",
  label: "AVIF → GIF",
  fromMime: ["image/avif"],
  toMime: "image/gif",
  accept: [".avif"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeGifFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default avifToGif;
