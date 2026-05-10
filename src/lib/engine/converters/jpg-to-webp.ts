import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const jpgToWebp: Converter = {
  id: "jpg-to-webp",
  label: "JPG → WebP",
  fromMime: ["image/jpeg"],
  toMime: "image/webp",
  accept: [".jpg", ".jpeg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, {
      toMime: "image/webp",
      quality: opts?.quality ?? 0.85,
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "webp") };
  },
};

export default jpgToWebp;
