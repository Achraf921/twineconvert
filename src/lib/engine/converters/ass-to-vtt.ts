import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAss, buildVtt } from "../util/subtitle";

const assToVtt: Converter = {
  id: "ass-to-vtt",
  label: "ASS → VTT",
  fromMime: ["text/x-ssa", "text/plain"],
  accept: [".ass", ".ssa"],
  toMime: "text/vtt",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let vtt: string;
    try {
      const cues = parseAss(await input.text());
      if (cues.length === 0) {
        throw new Error(
          "No Dialogue lines found in the [Events] section. Check the .ass file is valid.",
        );
      }
      vtt = buildVtt(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ASS to VTT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([vtt], { type: "text/vtt;charset=utf-8" }),
      filename: swapExtension(input.name, "vtt"),
    };
  },
};

export default assToVtt;
