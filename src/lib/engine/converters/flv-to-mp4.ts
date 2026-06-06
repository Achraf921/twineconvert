import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * FLV → MP4. FLV is the old Flash Video container; lots of archived
 * tutorials, screencasts, and old livestream recordings live in it.
 * Browsers no longer play Flash, but the H.264 video inside is fine
 * once re-muxed (or re-encoded if needed) into an MP4 wrapper.
 */
const flvToMp4: Converter = {
  id: "flv-to-mp4",
  label: "FLV → MP4",
  fromMime: ["video/x-flv", "video/flv"],
  toMime: "video/mp4",
  accept: [".flv"],
  maxFileSizeBytes: 4 * 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.flv",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        // Try a copy mux first via libx264/aac re-encode for safety;
        // FLV streams are commonly already H.264 + AAC so this stays fast.
        args: ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg FLV→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default flvToMp4;
