import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const icoToJpg: Converter = {
  id: "ico-to-jpg",
  label: "ICO → JPG",
  fromMime: ["image/x-icon", "image/vnd.microsoft.icon"],
  accept: [".ico"],
  toMime: "image/jpeg",

  async convert(input, opts) {
    opts?.onProgress?.(0.2);
    // ICOs frequently include transparency — we flatten on white when
    // targeting JPEG since JPEG can't carry an alpha channel.
    const blob = await canvasEncode(input, {
      toMime: "image/jpeg",
      quality: opts?.quality ?? 0.92,
      background: "#ffffff",
    });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default icoToJpg;
