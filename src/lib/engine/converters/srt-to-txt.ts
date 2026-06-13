import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSubtitle, buildPlainText } from "../util/subtitle";

/**
 * SRT → Text. Extracts the plain-text transcript (timestamps,
 * indices, and inline markup removed; repeated auto-caption lines
 * de-duplicated).
 */
const srtToTxt: Converter = {
  id: "srt-to-txt",
  label: "SRT → Text",
  fromMime: ["application/x-subrip", "text/plain"],
  accept: [".srt"],
  toMime: "text/plain",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cues = parseSubtitle(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in the SRT file");
      out = buildPlainText(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SRT to Text",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default srtToTxt;
