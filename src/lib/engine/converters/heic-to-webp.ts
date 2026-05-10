import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { decodeHeic } from "../util/heic-decode";
import { swapExtension } from "../util/canvas-encode";

const heicToWebp: Converter = {
  id: "heic-to-webp",
  label: "HEIC → WebP",
  fromMime: ["image/heic", "image/heif"],
  toMime: "image/webp",
  accept: [".heic", ".heif"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      blob = await decodeHeic(input, "image/webp", opts?.quality ?? 0.9);
    } catch (err) {
      throw new ConvertFailedError(
        "HEIC decode failed, file may be corrupt or use an unsupported HEIC profile",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "webp") };
  },
};

export default heicToWebp;
