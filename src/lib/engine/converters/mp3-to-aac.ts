import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MP3 → AAC. AAC is the codec Apple devices, modern web audio, and
 * most streaming pipelines prefer. Re-encoding at 192 kbps gives a
 * smaller file than the same-perceived-quality MP3, useful when
 * targeting iOS or piping into an HLS/DASH workflow.
 */
const mp3ToAac: Converter = {
  id: "mp3-to-aac",
  label: "MP3 → AAC",
  fromMime: ["audio/mpeg", "audio/mp3"],
  toMime: "audio/aac",
  accept: [".mp3"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp3",
        outputName: "out.aac",
        outputMime: "audio/aac",
        args: ["-codec:a", "aac", "-b:a", "192k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg MP3→AAC failed: ${err.message}` : "FFmpeg MP3→AAC failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "aac") };
  },
};

export default mp3ToAac;
