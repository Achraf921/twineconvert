import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * M4A → MP3. M4A is AAC inside an MP4 container; we re-encode to MP3
 * since some target devices/players still don't accept AAC. VBR ~190kbps
 * is a transparent default.
 */
const m4aToMp3: Converter = {
  id: "m4a-to-mp3",
  label: "M4A → MP3",
  fromMime: ["audio/mp4", "audio/m4a", "audio/x-m4a"],
  toMime: "audio/mpeg",
  accept: [".m4a"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.m4a",
        outputName: "out.mp3",
        outputMime: "audio/mpeg",
        args: ["-codec:a", "libmp3lame", "-q:a", "2"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg M4A→MP3 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp3") };
  },
};

export default m4aToMp3;
