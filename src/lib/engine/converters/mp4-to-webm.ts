import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MP4 → WebM. WebM (VP9 + Opus) is the open codec target the modern
 * web prefers, especially for background autoplay videos (smaller
 * than equivalent H.264 MP4) and as a Chrome / Firefox-friendly
 * alternative on sites that do not want to ship MP4.
 */
const mp4ToWebm: Converter = {
  id: "mp4-to-webm",
  label: "MP4 → WebM",
  fromMime: ["video/mp4"],
  toMime: "video/webm",
  accept: [".mp4"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp4",
        outputName: "out.webm",
        outputMime: "video/webm",
        // VP9 + Opus is the best-of-both-worlds default: small files
        // for the web, broad browser support, no patent worries.
        args: ["-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg MP4→WebM failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "webm") };
  },
};

export default mp4ToWebm;
