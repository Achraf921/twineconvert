import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAse, parseHexList } from "../util/palette";

/**
 * HEX list → ASE. Input is a plain text file with one hex code per line
 * (with or without leading '#'). Targets the very common workflow:
 * "I have a list of hex codes from Coolors / a design doc / a Figma
 * style guide; I want to load this into Adobe."
 */
const hexToAse: Converter = {
  id: "hex-to-ase",
  label: "HEX list → ASE",
  fromMime: ["text/plain"],
  accept: [".txt", ".hex"],
  toMime: "application/octet-stream",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const palette = parseHexList(await input.text());
      if (palette.colors.length === 0) throw new Error("No valid hex codes found in input");
      buf = buildAse(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not build ASE from HEX list", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/octet-stream" }), filename: swapExtension(input.name, "ase") };
  },
};

export default hexToAse;
