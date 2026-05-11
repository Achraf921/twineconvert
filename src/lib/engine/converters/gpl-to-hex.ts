import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildHexList, parseGpl } from "../util/palette";

/**
 * GPL (GIMP Palette) → HEX list. Reverse of hex-to-gpl. One hex per
 * line, swatch names preserved as inline comments.
 */
const gplToHex: Converter = {
  id: "gpl-to-hex",
  label: "GPL → HEX list",
  fromMime: ["text/plain"],
  accept: [".gpl"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const palette = parseGpl(await input.text());
      out = buildHexList(palette);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GPL to HEX list",
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

export default gplToHex;
