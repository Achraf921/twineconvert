import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ffmpegConvert } from "../util/ffmpeg-runner";

/**
 * MOV → GIF. Apple screen recordings come out as .mov; turning them
 * into GIFs is the standard "demo loop for a README, tweet, or Slack"
 * workflow. We use the two-pass palettegen trick FFmpeg recommends
 * for visibly cleaner GIFs than the default single-pass quantize.
 *
 * Output capped at 10fps to keep the file size reasonable for the
 * embed-in-a-doc use case.
 */
const movToGif: Converter = {
  id: "mov-to-gif",
  label: "MOV → GIF",
  fromMime: ["video/quicktime", "video/mov", "video/mp4"],
  toMime: "image/gif",
  accept: [".mov"],
  maxFileSizeBytes: 300 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let blob: Blob;
    try {
      blob = await ffmpegConvert(input, {
        inputName: "in.mov",
        outputName: "out.gif",
        outputMime: "image/gif",
        // Single-pass palette generation via the split+palettegen+paletteuse
        // filter chain. Gives near two-pass quality from one FFmpeg invocation.
        args: [
          "-vf",
          "fps=10,split [a][b];[a] palettegen [p];[b][p] paletteuse",
        ],
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.93),
      });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error && err.message ? `FFmpeg MOV→GIF failed: ${err.message}` : "FFmpeg MOV→GIF failed", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gif") };
  },
};

export default movToGif;
