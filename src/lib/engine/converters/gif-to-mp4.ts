import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * GIF → MP4. MP4 is dramatically smaller than GIF for the same animation
 * (often 10-20x smaller), which is why every social platform converts
 * uploaded GIFs to MP4 internally. Width is forced to even pixels via
 * the scale filter, H.264 requires even dimensions.
 */
const gifToMp4: Converter = {
  id: "gif-to-mp4",
  label: "GIF → MP4",
  fromMime: ["image/gif"],
  toMime: "video/mp4",
  accept: [".gif"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.gif",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: [
          "-vf",
          "scale=trunc(iw/2)*2:trunc(ih/2)*2",
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-crf", "23",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
        ],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError("FFmpeg GIF→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default gifToMp4;
