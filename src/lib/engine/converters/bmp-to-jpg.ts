import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const bmpToJpg: Converter = {
  id: "bmp-to-jpg",
  label: "BMP → JPG",
  fromMime: ["image/bmp", "image/x-bmp"],
  toMime: "image/jpeg",
  accept: [".bmp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, {
      toMime: "image/jpeg",
      quality: opts?.quality ?? 0.92,
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default bmpToJpg;
