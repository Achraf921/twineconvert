import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildSbv, parseSubtitle } from "../util/subtitle";

const srtToSbv: Converter = {
  id: "srt-to-sbv",
  label: "SRT → SBV",
  fromMime: ["application/x-subrip", "text/plain"],
  accept: [".srt"],
  toMime: "text/sbv",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("SRT has no cues");
      out = buildSbv(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SRT to SBV",
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

export default srtToSbv;
