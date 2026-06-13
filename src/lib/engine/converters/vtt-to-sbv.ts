import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSubtitle, buildSbv } from "../util/subtitle";

/**
 * VTT → SBV. Re-times the cues into the target subtitle format
 * through the shared cue model.
 */
const vttToSbv: Converter = {
  id: "vtt-to-sbv",
  label: "VTT → SBV",
  fromMime: ["text/vtt", "text/plain"],
  accept: [".vtt"],
  toMime: "text/sbv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in the VTT file");
      out = buildSbv(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert VTT to SBV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/sbv;charset=utf-8" }),
      filename: swapExtension(input.name, "sbv"),
    };
  },
};

export default vttToSbv;
