import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildVtt, parseSubtitle } from "../util/subtitle";

/**
 * SRT → WebVTT. Cross-syntax conversion: timestamps switch from `,` to
 * `.` decimal separator and a `WEBVTT` header is added. Caption text
 * itself is unchanged. Bijective with vtt-to-srt for cues that don't
 * use VTT-only features (positioning, voice tags).
 */
const srtToVtt: Converter = {
  id: "srt-to-vtt",
  label: "SRT → WebVTT",
  fromMime: ["text/plain", "application/x-subrip"],
  accept: [".srt"],
  toMime: "text/vtt",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let vtt: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in SRT");
      vtt = buildVtt(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SRT to WebVTT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([vtt], { type: "text/vtt;charset=utf-8" }),
      filename: swapExtension(input.name, "vtt"),
    };
  },
};

export default srtToVtt;
