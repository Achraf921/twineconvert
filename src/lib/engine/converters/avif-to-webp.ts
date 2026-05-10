import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const avifToWebp: Converter = {
  id: "avif-to-webp",
  label: "AVIF → WebP",
  fromMime: ["image/avif"],
  toMime: "image/webp",
  accept: [".avif"],

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

export default avifToWebp;
