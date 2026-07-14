import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * AIFF → MP3. AIFF is Apple's uncompressed audio (Logic, GarageBand,
 * Pro Tools sessions, CD rips on Mac). Files are huge; MP3 at libmp3lame
 * VBR ~190kbps gives a ~10x size reduction with no perceptible loss.
 */
const aiffToMp3: Converter = {
  id: "aiff-to-mp3",
  label: "AIFF → MP3",
  fromMime: ["audio/aiff", "audio/x-aiff"],
  toMime: "audio/mpeg",
  accept: [".aiff", ".aif", ".aifc"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.aiff",
        outputName: "out.mp3",
        outputMime: "audio/mpeg",
        args: ["-codec:a", "libmp3lame", "-q:a", "2"],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg AIFF→MP3 failed: ${err.message}` : "FFmpeg AIFF→MP3 failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "mp3") };
  },
};

export default aiffToMp3;
