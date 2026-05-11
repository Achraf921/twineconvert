import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildSrt, parseSubtitle } from "../util/subtitle";

/**
 * WebVTT → SRT. Strips the VTT header, re-formats timestamps from `.`
 * to `,` decimal, drops VTT-only cue settings (position, alignment,
 * voice tags). For cues that only use the shared SRT/VTT subset the
 * conversion is bijective with srt-to-vtt.
 */
const vttToSrt: Converter = {
  id: "vtt-to-srt",
  label: "WebVTT → SRT",
  fromMime: ["text/vtt", "text/plain"],
  accept: [".vtt"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let srt: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in WebVTT");
      srt = buildSrt(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert WebVTT to SRT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([srt], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "srt"),
    };
  },
};

export default vttToSrt;
