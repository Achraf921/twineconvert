import type { Converter, ConvertResult } from "../types";
import { ConvertFailedError } from "../types";

/**
 * HEIC → JPG.
 *
 * heic2any wraps libheif-js + Canvas to decode HEIC and re-encode as JPEG.
 * It only works in the browser (depends on Canvas + Image APIs), so this
 * file MUST NOT be imported from a server component or any code path that
 * runs during SSR / build. The lazy import inside `convert()` enforces that
 *, the heavy library is only fetched when an actual user action calls it.
 */

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB cap (HEIC files are typically 1-5MB; 100MB is way past pathological)

const heicToJpg: Converter = {
  id: "heic-to-jpg",
  label: "HEIC → JPG",
  fromMime: ["image/heic", "image/heif"],
  toMime: "image/jpeg",
  accept: [".heic", ".heif"],
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,

  async convert(input, opts): Promise<ConvertResult> {
    opts?.onProgress?.(0.05);

    // heic2any is browser-only, dynamic import keeps the lib out of the
    // initial route bundle until a real conversion is requested.
    const heic2any = (await import("heic2any")).default;

    opts?.onProgress?.(0.2);

    let blob: Blob;
    try {
      const result = await heic2any({
        blob: input,
        toType: "image/jpeg",
        quality: opts?.quality ?? 0.92,
      });
      // heic2any returns Blob | Blob[] depending on whether the HEIC is a
      // multi-image container (Live Photos, burst captures). Pick the first
      // image for the simple HEIC→JPG case; other converters that target
      // image sequences will handle this differently.
      blob = Array.isArray(result) ? result[0] : result;
    } catch (err) {
      throw new ConvertFailedError(
        "HEIC decode failed, file may be corrupt or use an unsupported HEIC profile",
        err,
      );
    }

    opts?.onProgress?.(1);

    // Replace .heic / .heif extension with .jpg
    const filename = input.name.replace(/\.(heic|heif)$/i, ".jpg");

    return {
      blob,
      filename: filename === input.name ? `${input.name}.jpg` : filename,
    };
  },
};

export default heicToJpg;
