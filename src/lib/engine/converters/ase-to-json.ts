import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildPaletteJson, parseAse } from "../util/palette";

const aseToJson: Converter = {
  id: "ase-to-json",
  label: "ASE → JSON",
  fromMime: ["application/octet-stream"],
  accept: [".ase"],
  toMime: "application/json",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const palette = parseAse(await input.arrayBuffer());
      out = buildPaletteJson(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert ASE to JSON", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "application/json" }), filename: swapExtension(input.name, "json") };
  },
};

export default aseToJson;
