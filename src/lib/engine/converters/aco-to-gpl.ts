import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildGpl, parseAco } from "../util/palette";

const acoToGpl: Converter = {
  id: "aco-to-gpl",
  label: "ACO → GPL",
  fromMime: ["application/octet-stream"],
  accept: [".aco"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const palette = parseAco(await input.arrayBuffer());
      out = buildGpl(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert ACO to GPL", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "gpl") };
  },
};

export default acoToGpl;
