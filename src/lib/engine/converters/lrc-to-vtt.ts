import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseLrc } from "../util/lrc";
import { buildVtt } from "../util/subtitle";

/**
 * LRC → WebVTT. Browser players want WebVTT for embedded captions;
 * lyric tracks belong in the same workflow. WebVTT also gives you
 * the option of CSS styling and positioning if you decide to enrich
 * the cues later.
 */
const lrcToVtt: Converter = {
  id: "lrc-to-vtt",
  label: "LRC → WebVTT",
  fromMime: ["text/plain", "application/x-lrc"],
  accept: [".lrc"],
  toMime: "text/vtt",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let vtt: string;
    try {
      const { cues } = parseLrc(await input.text());
      if (cues.length === 0) {
        throw new Error(
          "No timestamped lines found in the LRC file. LRC needs lines of the form '[mm:ss.xx]Lyric text'.",
        );
      }
      vtt = buildVtt(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert LRC to WebVTT",
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

export default lrcToVtt;
