import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const pngToWebp: Converter = {
  id: "png-to-webp",
  label: "PNG → WebP",
  fromMime: ["image/png"],
  toMime: "image/webp",
  accept: [".png"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    // WebP supports alpha so PNG transparency survives.
    const blob = await canvasEncode(input, {
      toMime: "image/webp",
      quality: opts?.quality ?? 0.9,
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "webp") };
  },
};

export default pngToWebp;
