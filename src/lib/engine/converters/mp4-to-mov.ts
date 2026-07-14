import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MP4 → MOV. MOV is QuickTime's container; structurally very similar
 * to MP4, so we stream-copy without re-encoding for a near-instant
 * lossless remux.
 */
const mp4ToMov: Converter = {
  id: "mp4-to-mov",
  label: "MP4 → MOV",
  fromMime: ["video/mp4"],
  toMime: "video/quicktime",
  accept: [".mp4", ".m4v"],
  maxFileSizeBytes: 4 * 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp4",
        outputName: "out.mov",
        outputMime: "video/quicktime",
        args: ["-c", "copy", "-movflags", "+faststart"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg MP4→MOV failed: ${err.message}` : "FFmpeg MP4→MOV failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mov") };
  },
};

export default mp4ToMov;
