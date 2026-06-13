import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

/**
 * SVG → WebP.
 * WebP keeps alpha, so transparency in the source survives.
 */
const svgToWebp: Converter = {
  id: "svg-to-webp",
  label: "SVG → WebP",
  fromMime: ["image/svg+xml"],
  toMime: "image/webp",
  accept: [".svg"],

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

export default svgToWebp;
