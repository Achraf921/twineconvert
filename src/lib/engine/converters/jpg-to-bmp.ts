import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const jpgToBmp: Converter = {
  id: "jpg-to-bmp",
  label: "JPG → BMP",
  fromMime: ["image/jpeg"],
  toMime: "image/bmp",
  accept: [".jpg", ".jpeg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, { toMime: "image/bmp" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "bmp") };
  },
};

export default jpgToBmp;
