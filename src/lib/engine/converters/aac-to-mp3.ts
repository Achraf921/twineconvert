import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * AAC → MP3. AAC is the codec inside .aac, .m4a, and most modern MP4
 * audio. Re-encoded to libmp3lame VBR ~190kbps so the output plays on
 * older devices and basic media players that still do not accept AAC.
 */
const aacToMp3: Converter = {
  id: "aac-to-mp3",
  label: "AAC → MP3",
  fromMime: ["audio/aac", "audio/x-aac", "audio/mp4"],
  toMime: "audio/mpeg",
  accept: [".aac"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.aac",
        outputName: "out.mp3",
        outputMime: "audio/mpeg",
        args: ["-codec:a", "libmp3lame", "-q:a", "2"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg AAC→MP3 failed: ${err.message}` : "FFmpeg AAC→MP3 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp3") };
  },
};

export default aacToMp3;
