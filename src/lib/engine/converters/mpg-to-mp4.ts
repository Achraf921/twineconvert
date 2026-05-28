import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MPG → MP4. MPG is the classic MPEG-1 / MPEG-2 program stream
 * container; lots of 1990s and 2000s digital camera output, old DVD
 * rips, and broadcast captures live in it. Re-encode to H.264 + AAC
 * for the same MP4 container modern players expect.
 */
const mpgToMp4: Converter = {
  id: "mpg-to-mp4",
  label: "MPG → MP4",
  fromMime: ["video/mpeg", "video/mpg"],
  toMime: "video/mp4",
  accept: [".mpg", ".mpeg"],
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mpg",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg MPG→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default mpgToMp4;
