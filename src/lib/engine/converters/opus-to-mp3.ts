import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * Opus → MP3. Opus is the default audio codec for WhatsApp voice notes,
 * Discord recordings, and a lot of WebRTC capture. Re-encoded to MP3
 * because Opus is still not supported in QuickTime, older Windows
 * Media Player, and most legacy in-car/podcast players.
 */
const opusToMp3: Converter = {
  id: "opus-to-mp3",
  label: "Opus → MP3",
  fromMime: ["audio/opus", "audio/ogg"],
  toMime: "audio/mpeg",
  accept: [".opus"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.opus",
        outputName: "out.mp3",
        outputMime: "audio/mpeg",
        args: ["-codec:a", "libmp3lame", "-q:a", "2"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg Opus→MP3 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp3") };
  },
};

export default opusToMp3;
