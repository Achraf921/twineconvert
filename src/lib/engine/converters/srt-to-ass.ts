import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSubtitle, buildAss } from "../util/subtitle";

const srtToAss: Converter = {
  id: "srt-to-ass",
  label: "SRT → ASS",
  fromMime: ["application/x-subrip", "text/plain"],
  accept: [".srt"],
  toMime: "text/x-ssa",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ass: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) {
        throw new Error("No subtitle cues found. Check the .srt file is valid (numbered cues + timing lines).");
      }
      ass = buildAss(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SRT to ASS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([ass], { type: "text/x-ssa;charset=utf-8" }),
      filename: swapExtension(input.name, "ass"),
    };
  },
};

export default srtToAss;
