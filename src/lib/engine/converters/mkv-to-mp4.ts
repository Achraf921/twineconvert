import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MKV → MP4. MKV is a container, not a codec, most MKV files already
 * carry H.264/AAC, so we try a stream-copy remux first. If the source
 * has truly exotic codecs (HEVC 10-bit, Opus audio, etc.) the user gets
 * a clean error and can use a desktop tool. Re-encoding fallback would
 * dramatically increase WASM runtime, not justified for v1.
 */
const mkvToMp4: Converter = {
  id: "mkv-to-mp4",
  label: "MKV → MP4",
  fromMime: ["video/x-matroska", "video/mkv"],
  toMime: "video/mp4",
  accept: [".mkv"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mkv",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: ["-c", "copy", "-movflags", "+faststart"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(
        "Could not remux MKV, codecs may be MP4-incompatible (HEVC, Opus, etc.)",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default mkvToMp4;
