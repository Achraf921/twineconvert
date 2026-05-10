import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const pngToGif: Converter = {
  id: "png-to-gif",
  label: "PNG → GIF",
  fromMime: ["image/png"],
  toMime: "image/gif",
  accept: [".png"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, { toMime: "image/gif" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default pngToGif;
