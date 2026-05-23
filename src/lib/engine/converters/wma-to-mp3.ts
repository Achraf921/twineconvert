import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * WMA → MP3. Windows Media Audio shows up in old voice recordings,
 * Windows Movie Maker exports, and legacy podcast archives. MP3 is the
 * universally playable replacement, no Microsoft codec required.
 */
const wmaToMp3: Converter = {
  id: "wma-to-mp3",
  label: "WMA → MP3",
  fromMime: ["audio/x-ms-wma", "audio/wma"],
  toMime: "audio/mpeg",
  accept: [".wma"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.wma",
        outputName: "out.mp3",
        outputMime: "audio/mpeg",
        args: ["-codec:a", "libmp3lame", "-q:a", "2"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg WMA→MP3 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp3") };
  },
};

export default wmaToMp3;
