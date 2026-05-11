import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAse, parseCss } from "../util/palette";

/**
 * CSS → ASE. Extracts every hex / rgb() color value from a stylesheet
 * and packages them as Adobe ASE swatches. Targets the common workflow
 * "I have a design system in CSS variables, I want to load the colors
 * into Adobe Photoshop / Illustrator." Reverse of ase-to-css.
 */
const cssToAse: Converter = {
  id: "css-to-ase",
  label: "CSS → ASE",
  fromMime: ["text/css", "text/plain"],
  accept: [".css"],
  toMime: "application/octet-stream",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const palette = parseCss(await input.text());
      if (palette.colors.length === 0) {
        throw new Error("No color values found in CSS");
      }
      buf = buildAse(palette);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build ASE from CSS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], { type: "application/octet-stream" }),
      filename: swapExtension(input.name, "ase"),
    };
  },
};

export default cssToAse;
