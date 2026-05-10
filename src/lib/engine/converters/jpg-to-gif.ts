import type { Converter } from "../types";
import { encodeGifFromImage } from "../util/gif-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * JPG to GIF. Single-frame static GIF via gifenc (Canvas.toBlob does
 * not support image/gif). For animated GIFs from video, see mp4-to-gif.
 */
const jpgToGif: Converter = {
  id: "jpg-to-gif",
  label: "JPG → GIF",
  fromMime: ["image/jpeg"],
  toMime: "image/gif",
  accept: [".jpg", ".jpeg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await encodeGifFromImage(input);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default jpgToGif;
