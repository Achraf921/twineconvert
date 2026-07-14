import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

const mp4ToAvi: Converter = {
  id: "mp4-to-avi",
  label: "MP4 → AVI",
  fromMime: ["video/mp4"],
  toMime: "video/x-msvideo",
  accept: [".mp4", ".m4v"],
  maxFileSizeBytes: 4 * 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp4",
        outputName: "out.avi",
        outputMime: "video/x-msvideo",
        args: ["-c:v", "mpeg4", "-q:v", "5", "-c:a", "mp3"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg MP4→AVI failed: ${err.message}` : "FFmpeg MP4→AVI failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "avi") };
  },
};

export default mp4ToAvi;
