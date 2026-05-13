import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSubtitle, buildAss } from "../util/subtitle";

const vttToAss: Converter = {
  id: "vtt-to-ass",
  label: "VTT → ASS",
  fromMime: ["text/vtt", "text/plain"],
  accept: [".vtt"],
  toMime: "text/x-ssa",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ass: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) {
        throw new Error("No subtitle cues found. Check the .vtt file is valid (WEBVTT header + cue blocks).");
      }
      ass = buildAss(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert VTT to ASS",
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

export default vttToAss;
