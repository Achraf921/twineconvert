import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const webpToJpg: Converter = {
  id: "webp-to-jpg",
  label: "WebP → JPG",
  fromMime: ["image/webp"],
  toMime: "image/jpeg",
  accept: [".webp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, {
      toMime: "image/jpeg",
      quality: opts?.quality ?? 0.92,
      background: "#ffffff",
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default webpToJpg;
