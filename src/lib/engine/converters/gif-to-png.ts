import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const gifToPng: Converter = {
  id: "gif-to-png",
  label: "GIF → PNG",
  fromMime: ["image/gif"],
  toMime: "image/png",
  accept: [".gif"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    // First frame only (animated GIF flattening). Alpha preserved.
    const blob = await canvasEncode(input, { toMime: "image/png" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default gifToPng;
