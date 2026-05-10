import type { Converter } from "../types";
import { encodeGifFromImage } from "../util/gif-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * PNG to GIF. Single-frame static GIF via gifenc (Canvas.toBlob does
 * not support image/gif).
 */
const pngToGif: Converter = {
  id: "png-to-gif",
  label: "PNG → GIF",
  fromMime: ["image/png"],
  toMime: "image/gif",
  accept: [".png"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeGifFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default pngToGif;
