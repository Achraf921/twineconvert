import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MP3 → FLAC. Lossless re-encode of an already-lossy source, output
 * fidelity is bounded by the MP3 input. Useful for archival workflows
 * that require FLAC as the canonical container even if the source is MP3.
 */
const mp3ToFlac: Converter = {
  id: "mp3-to-flac",
  label: "MP3 → FLAC",
  fromMime: ["audio/mpeg", "audio/mp3"],
  toMime: "audio/flac",
  accept: [".mp3"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp3",
        outputName: "out.flac",
        outputMime: "audio/flac",
        args: ["-codec:a", "flac"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg MP3→FLAC failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "flac") };
  },
};

export default mp3ToFlac;
