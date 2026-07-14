import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MTS → MP4. MTS (and M2TS) is the AVCHD container camcorders and
 * Sony / Panasonic cameras write to SD cards. Editors handle it but
 * upload sites and players prefer MP4. Re-encode to H.264 + AAC.
 */
const mtsToMp4: Converter = {
  id: "mts-to-mp4",
  label: "MTS → MP4",
  fromMime: ["video/mp2t", "video/MP2T"],
  toMime: "video/mp4",
  accept: [".mts", ".m2ts", ".ts"],
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mts",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg MTS→MP4 failed: ${err.message}` : "FFmpeg MTS→MP4 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default mtsToMp4;
