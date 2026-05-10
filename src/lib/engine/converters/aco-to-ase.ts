import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAse, parseAco } from "../util/palette";

const acoToAse: Converter = {
  id: "aco-to-ase",
  label: "ACO → ASE",
  fromMime: ["application/octet-stream"],
  accept: [".aco"],
  toMime: "application/octet-stream",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const palette = parseAco(await input.arrayBuffer());
      buf = buildAse(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert ACO to ASE", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/octet-stream" }), filename: swapExtension(input.name, "ase") };
  },
};

export default acoToAse;
