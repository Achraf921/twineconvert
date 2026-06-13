import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSubtitle, buildAss } from "../util/subtitle";

/**
 * SBV → ASS. Re-times the cues into the target subtitle format
 * through the shared cue model.
 */
const sbvToAss: Converter = {
  id: "sbv-to-ass",
  label: "SBV → ASS",
  fromMime: ["text/sbv", "text/plain"],
  accept: [".sbv"],
  toMime: "text/x-ssa",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in the SBV file");
      out = buildAss(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SBV to ASS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/x-ssa;charset=utf-8" }),
      filename: swapExtension(input.name, "ass"),
    };
  },
};

export default sbvToAss;
