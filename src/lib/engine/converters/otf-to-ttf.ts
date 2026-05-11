import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { convertFont } from "../util/font";

/**
 * OTF (with CFF outlines) → TTF (with TrueType outlines). Strictly speaking
 * this is a quadratic-curve conversion (CFF cubic → TTF quadratic) which
 * fonteditor-core handles internally. The visual output is essentially
 * indistinguishable but TrueType-style hinting is added during emit.
 */
const otfToTtf: Converter = {
  id: "otf-to-ttf",
  label: "OTF → TTF",
  fromMime: ["font/otf", "application/x-font-otf", "application/font-sfnt"],
  accept: [".otf"],
  toMime: "font/ttf",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: ArrayBuffer;
    try {
      bytes = await convertFont(await input.arrayBuffer(), "otf", "ttf");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert OTF to TTF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bytes], { type: "font/ttf" }),
      filename: swapExtension(input.name, "ttf"),
    };
  },
};

export default otfToTtf;
