import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

/**
 * JPG → GIF. Single-frame GIF, animated GIF generation requires a
 * separate gif-encoder lib and is outside scope for the static-image
 * routes. For animated GIFs from video, see mp4-to-gif.
 */
const jpgToGif: Converter = {
  id: "jpg-to-gif",
  label: "JPG → GIF",
  fromMime: ["image/jpeg"],
  toMime: "image/gif",
  accept: [".jpg", ".jpeg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, { toMime: "image/gif" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default jpgToGif;
