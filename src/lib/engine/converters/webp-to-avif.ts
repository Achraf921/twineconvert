import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { encodeAvif } from "../util/avif-encode";

const webpToAvif: Converter = {
  id: "webp-to-avif",
  label: "WebP → AVIF",
  fromMime: ["image/webp"],
  toMime: "image/avif",
  accept: [".webp"],
  maxFileSizeBytes: 30 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const q = opts?.quality !== undefined ? Math.round(opts.quality * 100) : 75;
      blob = await encodeAvif(input, { quality: q });
    } catch (err) {
      throw new ConvertFailedError("AVIF encode failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "avif") };
  },
};

export default webpToAvif;
