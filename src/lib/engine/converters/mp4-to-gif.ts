import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MP4 → GIF. Two-pass approach (palettegen + paletteuse) is what produces
 * good-quality GIFs from video, the default quantizer is hideous. We're
 * doing it in one pipeline using a complex filter, which is slower but
 * keeps the runner generic. Output is 480px wide @ 12fps as a sane default
 * for "share-to-Slack" use cases.
 */
const mp4ToGif: Converter = {
  id: "mp4-to-gif",
  label: "MP4 → GIF",
  fromMime: ["video/mp4"],
  toMime: "image/gif",
  accept: [".mp4", ".m4v"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp4",
        outputName: "out.gif",
        outputMime: "image/gif",
        args: [
          "-vf",
          "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
          "-loop", "0",
        ],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg MP4→GIF failed: ${err.message}` : "FFmpeg MP4→GIF failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default mp4ToGif;
