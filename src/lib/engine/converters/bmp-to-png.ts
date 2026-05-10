import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const bmpToPng: Converter = {
  id: "bmp-to-png",
  label: "BMP → PNG",
  fromMime: ["image/bmp", "image/x-bmp"],
  toMime: "image/png",
  accept: [".bmp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, { toMime: "image/png" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default bmpToPng;
