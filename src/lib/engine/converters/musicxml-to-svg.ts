import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { renderMusicXmlToSvg } from "../util/verovio";

/**
 * MusicXML → SVG. Renders the score as engraved sheet music via the
 * Verovio toolkit (the same renderer IMSLP and the Music Encoding
 * Initiative tooling use). Output is a single SVG with every page
 * concatenated, ready to embed on a web page or open in any vector
 * editor (Inkscape, Illustrator).
 */
const musicxmlToSvg: Converter = {
  id: "musicxml-to-svg",
  label: "MusicXML → SVG",
  fromMime: [
    "application/vnd.recordare.musicxml+xml",
    "application/vnd.recordare.musicxml",
    "application/xml",
    "text/xml",
  ],
  accept: [".musicxml", ".xml"],
  toMime: "image/svg+xml",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let svg: string;
    try {
      const text = await input.text();
      svg = await renderMusicXmlToSvg(text);
      opts?.onProgress?.(0.95);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render MusicXML to SVG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "svg"),
    };
  },
};

export default musicxmlToSvg;
