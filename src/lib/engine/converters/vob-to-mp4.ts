import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * VOB → MP4. VOB is the MPEG-2 program stream variant used on DVDs.
 * Old DVD rips and home-video discs are full of .vob files; modern
 * players want MP4. Re-encode to H.264 + AAC.
 *
 * Note: DRM-encrypted commercial-DVD VOBs cannot be decoded by FFmpeg
 * without the user supplying the CSS key separately; this converter
 * handles the plain unencrypted case (home recordings, archive rips).
 */
const vobToMp4: Converter = {
  id: "vob-to-mp4",
  label: "VOB → MP4",
  fromMime: ["video/dvd", "video/mpeg"],
  toMime: "video/mp4",
  accept: [".vob"],
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.vob",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg VOB→MP4 failed: ${err.message}` : "FFmpeg VOB→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default vobToMp4;
