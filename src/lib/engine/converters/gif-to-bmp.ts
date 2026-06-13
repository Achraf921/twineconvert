import type { Converter } from "../types";
import { encodeBmpFromImage } from "../util/bmp-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * GIF → BMP.
 */
const gifToBmp: Converter = {
  id: "gif-to-bmp",
  label: "GIF → BMP",
  fromMime: ["image/gif"],
  toMime: "image/bmp",
  accept: [".gif"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeBmpFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "bmp") };
  },
};

export default gifToBmp;
