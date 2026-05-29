import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildLrc } from "../util/lrc";
import { parseSubtitle } from "../util/subtitle";

/**
 * SRT → LRC. Reverse direction: subtitle cues become LRC lyric
 * timestamps. SRT cue end times are dropped (LRC only marks the
 * start of each line); multi-line SRT cues are joined onto a single
 * LRC line per timestamp.
 */
const srtToLrc: Converter = {
  id: "srt-to-lrc",
  label: "SRT → LRC",
  fromMime: ["text/plain", "application/x-subrip"],
  accept: [".srt"],
  toMime: "application/x-lrc",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let lrc: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in SRT");
      // Collapse multi-line cue text into a single LRC line.
      const flat = cues.map((c) => ({
        ...c,
        text: c.text.replace(/\s*\n\s*/g, " ").trim(),
      }));
      lrc = buildLrc(flat);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SRT to LRC",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([lrc], { type: "application/x-lrc;charset=utf-8" }),
      filename: swapExtension(input.name, "lrc"),
    };
  },
};

export default srtToLrc;
