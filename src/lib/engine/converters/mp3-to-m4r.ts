import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MP3 → M4R (iPhone ringtone). M4R is an AAC stream in an MP4 container
 * with the .m4r extension that iOS recognises as a ringtone. We trim to
 * the first 40 seconds (iOS rejects ringtones longer than ~40s) and emit
 * via FFmpeg's "ipod" muxer which produces the exact container layout
 * the Files app and iTunes need to drop into the Ringtones folder.
 */
const mp3ToM4r: Converter = {
  id: "mp3-to-m4r",
  label: "MP3 → M4R (iPhone Ringtone)",
  fromMime: ["audio/mpeg", "audio/mp3"],
  toMime: "audio/mp4",
  accept: [".mp3"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp3",
        // FFmpeg picks the muxer from the extension; ".m4a" + "-f ipod"
        // gives an iOS-compatible MP4-audio container we then rename.
        outputName: "out.m4a",
        outputMime: "audio/mp4",
        args: ["-codec:a", "aac", "-b:a", "192k", "-t", "40", "-f", "ipod"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg MP3→M4R failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "m4r") };
  },
};

export default mp3ToM4r;
