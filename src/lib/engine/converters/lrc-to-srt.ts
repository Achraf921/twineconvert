import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseLrc } from "../util/lrc";
import { buildSrt } from "../util/subtitle";

/**
 * LRC → SRT. Lyric files become standard subtitles, useful for
 * burning lyric tracks into a karaoke video, importing into video
 * editors (Premiere, DaVinci Resolve, Final Cut all read SRT), or
 * embedding alongside a music video upload.
 *
 * Each LRC timestamp becomes a cue; end-of-cue is set to the next
 * line's start (or +4s for the last line) so SRT readers display
 * each lyric until the next one begins.
 */
const lrcToSrt: Converter = {
  id: "lrc-to-srt",
  label: "LRC → SRT",
  fromMime: ["text/plain", "application/x-lrc"],
  accept: [".lrc"],
  toMime: "application/x-subrip",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let srt: string;
    try {
      const { cues } = parseLrc(await input.text());
      if (cues.length === 0) {
        throw new Error(
          "No timestamped lines found in the LRC file. LRC needs lines of the form '[mm:ss.xx]Lyric text'.",
        );
      }
      srt = buildSrt(cues);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert LRC to SRT",
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

export default lrcToSrt;
