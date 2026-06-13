import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

/**
 * GIF → WebP.
 * WebP keeps alpha, so transparency in the source survives.
 */
const gifToWebp: Converter = {
  id: "gif-to-webp",
  label: "GIF → WebP",
  fromMime: ["image/gif"],
  toMime: "image/webp",
  accept: [".gif"],

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

export default gifToWebp;
