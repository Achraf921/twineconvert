import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAco, parseAse } from "../util/palette";

const aseToAco: Converter = {
  id: "ase-to-aco",
  label: "ASE → ACO (Photoshop)",
  fromMime: ["application/octet-stream"],
  accept: [".ase"],
  toMime: "application/octet-stream",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const palette = parseAse(await input.arrayBuffer());
      buf = buildAco(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert ASE to ACO", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/octet-stream" }), filename: swapExtension(input.name, "aco") };
  },
};

export default aseToAco;
