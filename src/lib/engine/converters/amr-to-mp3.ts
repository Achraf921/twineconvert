import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * AMR → MP3. AMR (Adaptive Multi-Rate) is the codec older Android phones
 * and most basic voice-recorder apps use. MP3 is the universal target
 * for editing or sharing those recordings somewhere that does not have
 * a narrowband telephony codec.
 */
const amrToMp3: Converter = {
  id: "amr-to-mp3",
  label: "AMR → MP3",
  fromMime: ["audio/amr", "audio/3gpp"],
  toMime: "audio/mpeg",
  accept: [".amr"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.amr",
        outputName: "out.mp3",
        outputMime: "audio/mpeg",
        args: ["-codec:a", "libmp3lame", "-q:a", "2"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg AMR→MP3 failed: ${err.message}` : "FFmpeg AMR→MP3 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp3") };
  },
};

export default amrToMp3;
