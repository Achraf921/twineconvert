import type { Converter, ConvertResult } from "../types";
import { ConvertFailedError } from "../types";
import { decodeHeic } from "../util/heic-decode";

/**
 * HEIC → JPG. Routes through the shared decodeHeic util (libheif-js based).
 * iPhone Live Photos, edited photos, and HEVC main-10 HEIC files all
 * decode cleanly here; the older heic2any-based path failed on those
 * with `Could not parse HEIF file` errors despite the files being valid.
 */

const heicToJpg: Converter = {
  id: "heic-to-jpg",
  label: "HEIC → JPG",
  fromMime: ["image/heic", "image/heif"],
  toMime: "image/jpeg",
  accept: [".heic", ".heif"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts): Promise<ConvertResult> {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      blob = await decodeHeic(input, "image/jpeg", opts?.quality ?? 0.92);
    } catch (err) {
      throw new ConvertFailedError(
        "HEIC decode failed, file may be corrupt or use an unsupported HEIC profile",
        err,
      );
    }
    opts?.onProgress?.(1);
    const filename = input.name.replace(/\.(heic|heif)$/i, ".jpg");
    return {
      blob,
      filename: filename === input.name ? `${input.name}.jpg` : filename,
    };
  },
};

export default heicToJpg;
