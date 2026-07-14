import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * M4V → MP4. M4V is Apple's MP4 variant used by iTunes Store and old
 * iOS recordings. Modern players accept it directly, but plenty of
 * non-Apple editors / upload pipelines reject the extension even
 * though the container is byte-compatible with MP4. Re-mux without
 * re-encoding for a transparent, fast conversion.
 */
const m4vToMp4: Converter = {
  id: "m4v-to-mp4",
  label: "M4V → MP4",
  fromMime: ["video/x-m4v", "video/mp4"],
  toMime: "video/mp4",
  accept: [".m4v"],
  maxFileSizeBytes: 4 * 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.m4v",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        // -c copy: stream-copy the audio + video without re-encoding.
        // The container changes but the bytes inside do not.
        args: ["-c", "copy"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg M4V→MP4 failed: ${err.message}` : "FFmpeg M4V→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default m4vToMp4;
