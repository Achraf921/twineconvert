import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

/**
 * ICO → WebP.
 * WebP keeps alpha, so transparency in the source survives.
 */
const icoToWebp: Converter = {
  id: "ico-to-webp",
  label: "ICO → WebP",
  fromMime: ["image/x-icon", "image/vnd.microsoft.icon"],
  toMime: "image/webp",
  accept: [".ico"],

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

export default icoToWebp;
