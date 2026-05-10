import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MOV → MP4. Most MOV files are already H.264/AAC inside a QuickTime
 * container — we can stream-copy the codecs (`-c copy`) to remux without
 * re-encoding. Massively faster (seconds instead of minutes) and lossless.
 * Falls back are NOT implemented yet: if the input uses ProRes or another
 * non-MP4-compatible codec, FFmpeg errors out and we surface the failure.
 */
const movToMp4: Converter = {
  id: "mov-to-mp4",
  label: "MOV → MP4",
  fromMime: ["video/quicktime", "video/mov"],
  toMime: "video/mp4",
  accept: [".mov", ".qt"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mov",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: ["-c", "copy", "-movflags", "+faststart"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(
        "Could not remux MOV — the source may use ProRes or another non-MP4-compatible codec",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default movToMp4;
