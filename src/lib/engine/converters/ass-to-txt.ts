import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAss, buildPlainText } from "../util/subtitle";

/**
 * ASS → Text. Extracts the plain-text transcript (timestamps,
 * indices, and inline markup removed; repeated auto-caption lines
 * de-duplicated).
 */
const assToTxt: Converter = {
  id: "ass-to-txt",
  label: "ASS → Text",
  fromMime: ["text/x-ssa", "text/plain"],
  accept: [".ass", ".ssa"],
  toMime: "text/plain",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const cues = parseAss(await input.text());
      if (cues.length === 0) throw new Error("No subtitle cues found in the ASS file");
      out = buildPlainText(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ASS to Text",
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

export default assToTxt;
