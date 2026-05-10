import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const svgToJpg: Converter = {
  id: "svg-to-jpg",
  label: "SVG → JPG",
  fromMime: ["image/svg+xml"],
  toMime: "image/jpeg",
  accept: [".svg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, {
      toMime: "image/jpeg",
      quality: opts?.quality ?? 0.92,
      background: "#ffffff",
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default svgToJpg;
