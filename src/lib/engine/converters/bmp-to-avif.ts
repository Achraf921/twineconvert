import type { Converter } from "../types";
import { encodeAvif } from "../util/avif-encode";
import { swapExtension } from "../util/canvas-encode";

/**
 * BMP → AVIF.
 * AVIF is the newest web image format, smaller than WebP at equal
 * quality. Transparency in the source survives.
 */
const bmpToAvif: Converter = {
  id: "bmp-to-avif",
  label: "BMP → AVIF",
  fromMime: ["image/bmp", "image/x-bmp"],
  toMime: "image/avif",
  accept: [".bmp"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const q = opts?.quality !== undefined ? Math.round(opts.quality * 100) : 75;
    const blob = await encodeAvif(input, { quality: q });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "avif") };
  },
};

export default bmpToAvif;
