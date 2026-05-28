import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MPEG → MP4. Alias of mpg-to-mp4 for the `.mpeg` extension users
 * also commonly have. Same FFmpeg path, separate route so the
 * file-picker / SEO surface matches what people actually search.
 */
const mpegToMp4: Converter = {
  id: "mpeg-to-mp4",
  label: "MPEG → MP4",
  fromMime: ["video/mpeg"],
  toMime: "video/mp4",
  accept: [".mpeg", ".mpg"],
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mpeg",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg MPEG→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default mpegToMp4;
