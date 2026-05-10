import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MP4 → MP3. Strips video, encodes audio with libmp3lame at VBR ~190kbps
 * (-q:a 2). This is THE highest-volume video/audio query on the web —
 * "extract audio from video" / "convert mp4 to mp3" is millions/mo.
 */
const mp4ToMp3: Converter = {
  id: "mp4-to-mp3",
  label: "MP4 → MP3",
  fromMime: ["video/mp4"],
  toMime: "audio/mpeg",
  accept: [".mp4", ".m4v"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp4",
        outputName: "out.mp3",
        outputMime: "audio/mpeg",
        args: ["-vn", "-codec:a", "libmp3lame", "-q:a", "2"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(
        "FFmpeg failed — file may use an unsupported codec or be corrupt",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp3") };
  },
};

export default mp4ToMp3;
