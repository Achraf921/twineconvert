import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { encodeAvif } from "../util/avif-encode";

const jpgToAvif: Converter = {
  id: "jpg-to-avif",
  label: "JPG → AVIF",
  fromMime: ["image/jpeg"],
  toMime: "image/avif",
  accept: [".jpg", ".jpeg"],
  maxFileSizeBytes: 30 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      // AVIF quality scale is 0-100; map our 0..1 to 0..100
      const q = opts?.quality !== undefined ? Math.round(opts.quality * 100) : 75;
      blob = await encodeAvif(input, { quality: q });
    } catch (err) {
      throw new ConvertFailedError("AVIF encode failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "avif") };
  },
};

export default jpgToAvif;
