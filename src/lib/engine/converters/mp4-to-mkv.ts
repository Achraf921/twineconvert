import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MP4 → MKV. MKV is a more permissive container, we stream-copy
 * codecs without re-encoding (lossless, fast). The `-fflags +genpts`
 * regenerates timestamps so MKV's stricter timing requirements pass.
 */
const mp4ToMkv: Converter = {
  id: "mp4-to-mkv",
  label: "MP4 → MKV",
  fromMime: ["video/mp4"],
  toMime: "video/x-matroska",
  accept: [".mp4", ".m4v"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mp4",
        outputName: "out.mkv",
        outputMime: "video/x-matroska",
        args: ["-c", "copy"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg MP4→MKV failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mkv") };
  },
};

export default mp4ToMkv;
