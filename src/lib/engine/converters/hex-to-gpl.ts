import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildGpl, parseHexList } from "../util/palette";

const hexToGpl: Converter = {
  id: "hex-to-gpl",
  label: "HEX list → GPL",
  fromMime: ["text/plain"],
  accept: [".txt", ".hex"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const palette = parseHexList(await input.text());
      if (palette.colors.length === 0) throw new Error("No valid hex codes found in input");
      out = buildGpl(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not build GPL from HEX list", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "gpl") };
  },
};

export default hexToGpl;
