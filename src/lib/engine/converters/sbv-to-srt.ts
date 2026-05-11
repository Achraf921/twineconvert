import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildSrt, parseSubtitle } from "../util/subtitle";

const sbvToSrt: Converter = {
  id: "sbv-to-srt",
  label: "SBV → SRT",
  fromMime: ["text/sbv", "text/plain"],
  accept: [".sbv"],
  toMime: "application/x-subrip",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("SBV has no cues");
      out = buildSrt(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SBV to SRT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-subrip;charset=utf-8" }),
      filename: swapExtension(input.name, "srt"),
    };
  },
};

export default sbvToSrt;
