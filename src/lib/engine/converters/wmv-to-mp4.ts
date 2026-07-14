import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * WMV → MP4. Windows Media Video is the Microsoft container from the
 * 2000s Windows Movie Maker era. Nothing outside the MS ecosystem
 * plays it cleanly any more. Re-encode to H.264 + AAC in an MP4
 * wrapper for universal compatibility.
 */
const wmvToMp4: Converter = {
  id: "wmv-to-mp4",
  label: "WMV → MP4",
  fromMime: ["video/x-ms-wmv", "video/wmv"],
  toMime: "video/mp4",
  accept: [".wmv"],
  maxFileSizeBytes: 4 * 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.wmv",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg WMV→MP4 failed: ${err.message}` : "FFmpeg WMV→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default wmvToMp4;
