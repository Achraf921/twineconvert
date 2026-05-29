import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAss, buildSrt } from "../util/subtitle";

const assToSrt: Converter = {
  id: "ass-to-srt",
  label: "ASS → SRT",
  fromMime: ["text/x-ssa", "text/plain"],
  accept: [".ass", ".ssa"],
  toMime: "application/x-subrip",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let srt: string;
    try {
      const cues = parseAss(await input.text());
      if (cues.length === 0) {
        throw new Error(
          "No Dialogue lines found in the [Events] section. Check the .ass file is valid.",
        );
      }
      srt = buildSrt(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ASS to SRT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([srt], { type: "application/x-subrip;charset=utf-8" }),
      filename: swapExtension(input.name, "srt"),
    };
  },
};

export default assToSrt;
