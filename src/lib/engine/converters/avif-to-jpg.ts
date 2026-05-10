import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const avifToJpg: Converter = {
  id: "avif-to-jpg",
  label: "AVIF → JPG",
  fromMime: ["image/avif"],
  toMime: "image/jpeg",
  accept: [".avif"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    // Modern browsers (Chrome/Edge 85+, Safari 16.4+, Firefox 113+) can
    // decode AVIF natively. Canvas-based path works on those. Older
    // browsers will throw; the runner catches and surfaces a clean error.
    const blob = await canvasEncode(input, {
      toMime: "image/jpeg",
      quality: opts?.quality ?? 0.92,
      background: "#ffffff",
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default avifToJpg;
