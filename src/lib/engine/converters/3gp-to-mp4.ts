import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * 3GP → MP4. 3GP is the container older phones used for short clips
 * (3GPP/3GPP2 mobile spec). Modern editors and uploaders prefer MP4.
 * Re-encoded to H.264 + AAC for maximum compatibility.
 */
const threeGpToMp4: Converter = {
  id: "3gp-to-mp4",
  label: "3GP → MP4",
  fromMime: ["video/3gpp", "video/3gpp2"],
  toMime: "video/mp4",
  accept: [".3gp", ".3gpp", ".3g2"],
  maxFileSizeBytes: 300 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.3gp",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg 3GP→MP4 failed: ${err.message}` : "FFmpeg 3GP→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default threeGpToMp4;
