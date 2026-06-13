import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAss, buildSbv } from "../util/subtitle";

/**
 * ASS → SBV. Re-times the cues into the target subtitle format
 * through the shared cue model.
 */
const assToSbv: Converter = {
  id: "ass-to-sbv",
  label: "ASS → SBV",
  fromMime: ["text/x-ssa", "text/plain"],
  accept: [".ass", ".ssa"],
  toMime: "text/sbv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cues = parseAss(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in the ASS file");
      out = buildSbv(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ASS to SBV",
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

export default assToSbv;
