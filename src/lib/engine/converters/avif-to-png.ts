import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const avifToPng: Converter = {
  id: "avif-to-png",
  label: "AVIF → PNG",
  fromMime: ["image/avif"],
  toMime: "image/png",
  accept: [".avif"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    // PNG preserves AVIF's alpha channel (unlike JPEG output).
    const blob = await canvasEncode(input, { toMime: "image/png" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default avifToPng;
