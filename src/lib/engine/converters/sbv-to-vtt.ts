import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSubtitle, buildVtt } from "../util/subtitle";

/**
 * SBV → VTT. Re-times the cues into the target subtitle format
 * through the shared cue model.
 */
const sbvToVtt: Converter = {
  id: "sbv-to-vtt",
  label: "SBV → VTT",
  fromMime: ["text/sbv", "text/plain"],
  accept: [".sbv"],
  toMime: "text/vtt",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in the SBV file");
      out = buildVtt(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SBV to VTT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/vtt;charset=utf-8" }),
      filename: swapExtension(input.name, "vtt"),
    };
  },
};

export default sbvToVtt;
