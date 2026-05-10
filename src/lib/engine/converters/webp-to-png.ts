import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const webpToPng: Converter = {
  id: "webp-to-png",
  label: "WebP → PNG",
  fromMime: ["image/webp"],
  toMime: "image/png",
  accept: [".webp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, { toMime: "image/png" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default webpToPng;
