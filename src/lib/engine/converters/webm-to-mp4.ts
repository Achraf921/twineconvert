import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * WebM → MP4. WebM is VP8/VP9 video + Vorbis/Opus audio; MP4 expects
 * H.264 + AAC. Full re-encode required (slow). Using the libx264 ultrafast
 * preset to keep WASM runtime reasonable, quality is fine for casual use,
 * not broadcast. CRF 23 = visually-near-lossless default.
 */
const webmToMp4: Converter = {
  id: "webm-to-mp4",
  label: "WebM → MP4",
  fromMime: ["video/webm"],
  toMime: "video/mp4",
  accept: [".webm"],
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.webm",
        outputName: "out.mp4",
        outputMime: "video/mp4",
        args: [
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
        ],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg WebM→MP4 transcode failed: ${err.message}` : "FFmpeg WebM→MP4 transcode failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp4") };
  },
};

export default webmToMp4;
