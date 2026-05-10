import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildPaletteCss, parseAse } from "../util/palette";

const aseToCss: Converter = {
  id: "ase-to-css",
  label: "ASE → CSS variables",
  fromMime: ["application/octet-stream"],
  accept: [".ase"],
  toMime: "text/css",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const palette = parseAse(await input.arrayBuffer());
      out = buildPaletteCss(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert ASE to CSS", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/css;charset=utf-8" }), filename: swapExtension(input.name, "css") };
  },
};

export default aseToCss;
