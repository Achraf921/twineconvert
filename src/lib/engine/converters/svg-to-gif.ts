import type { Converter } from "../types";
import { encodeGifFromImage } from "../util/gif-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * SVG → GIF.
 * Single-frame static GIF output.
 */
const svgToGif: Converter = {
  id: "svg-to-gif",
  label: "SVG → GIF",
  fromMime: ["image/svg+xml"],
  toMime: "image/gif",
  accept: [".svg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeGifFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default svgToGif;
