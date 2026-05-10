import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const pngToJpg: Converter = {
  id: "png-to-jpg",
  label: "PNG → JPG",
  fromMime: ["image/png"],
  toMime: "image/jpeg",
  accept: [".png"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, {
      toMime: "image/jpeg",
      quality: opts?.quality ?? 0.92,
      // Flatten PNG transparency onto white when going to JPEG
      // (JPEG has no alpha channel; without this, transparent areas
      // would get a default black background which surprises users).
      background: "#ffffff",
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default pngToJpg;
