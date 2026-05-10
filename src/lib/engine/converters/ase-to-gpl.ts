import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildGpl, parseAse } from "../util/palette";

const aseToGpl: Converter = {
  id: "ase-to-gpl",
  label: "ASE → GPL (GIMP Palette)",
  fromMime: ["application/octet-stream"],
  accept: [".ase"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const palette = parseAse(await input.arrayBuffer());
      out = buildGpl(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert ASE to GPL", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "gpl") };
  },
};

export default aseToGpl;
