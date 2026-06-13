import type { Converter } from "../types";
import { encodeGifFromImage } from "../util/gif-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * ICO → GIF.
 * Single-frame static GIF output.
 */
const icoToGif: Converter = {
  id: "ico-to-gif",
  label: "ICO → GIF",
  fromMime: ["image/x-icon", "image/vnd.microsoft.icon"],
  toMime: "image/gif",
  accept: [".ico"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeGifFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default icoToGif;
