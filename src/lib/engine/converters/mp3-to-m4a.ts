import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

const mp3ToM4a: Converter = {
  id: "mp3-to-m4a",
  label: "MP3 → M4A",
  fromMime: ["audio/mpeg", "audio/mp3"],
  toMime: "audio/mp4",
  accept: [".mp3"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp3",
        outputName: "out.m4a",
        outputMime: "audio/mp4",
        args: ["-codec:a", "aac", "-b:a", "192k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg MP3→M4A failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "m4a") };
  },
};

export default mp3ToM4a;
