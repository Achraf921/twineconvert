import type { Converter } from "../types";
import { encodeBmpFromImage } from "../util/bmp-encode";
import { swapExtension } from "../util/canvas-encode";

const pngToBmp: Converter = {
  id: "png-to-bmp",
  label: "PNG → BMP",
  fromMime: ["image/png"],
  toMime: "image/bmp",
  accept: [".png"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeBmpFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "bmp") };
  },
};

export default pngToBmp;
