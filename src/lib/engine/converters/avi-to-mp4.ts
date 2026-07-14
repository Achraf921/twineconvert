import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

const aviToMp4: Converter = {
  id: "avi-to-mp4",
  label: "AVI → MP4",
  fromMime: ["video/avi", "video/x-msvideo"],
  toMime: "video/mp4",
  accept: [".avi"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.avi",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: [
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
        ],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg AVI→MP4 transcode failed: ${err.message}` : "FFmpeg AVI→MP4 transcode failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default aviToMp4;
