import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const gifToJpg: Converter = {
  id: "gif-to-jpg",
  label: "GIF → JPG",
  fromMime: ["image/gif"],
  toMime: "image/jpeg",
  accept: [".gif"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    // Animated GIFs return only the first frame via Canvas.drawImage ,
    // by design. Animated→video is a different family (FFmpeg.wasm).
    const blob = await canvasEncode(input, {
      toMime: "image/jpeg",
      quality: opts?.quality ?? 0.92,
      background: "#ffffff",
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default gifToJpg;
