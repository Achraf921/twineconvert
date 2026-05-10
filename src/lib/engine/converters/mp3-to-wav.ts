import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

const mp3ToWav: Converter = {
  id: "mp3-to-wav",
  label: "MP3 → WAV",
  fromMime: ["audio/mpeg", "audio/mp3"],
  toMime: "audio/wav",
  accept: [".mp3"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp3",
        outputName: "out.wav",
        outputMime: "audio/wav",
        // 16-bit signed little-endian PCM, the de-facto WAV everyone expects
        args: ["-acodec", "pcm_s16le"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg MP3→WAV failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "wav") };
  },
};

export default mp3ToWav;
