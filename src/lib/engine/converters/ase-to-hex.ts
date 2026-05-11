import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildHexList, parseAse } from "../util/palette";

/**
 * ASE → HEX list. Reverse of hex-to-ase. Outputs one hex code per line
 * with the swatch name preserved as a `; <name>` inline comment so a
 * round-trip back through the parser keeps both data and labels.
 */
const aseToHex: Converter = {
  id: "ase-to-hex",
  label: "ASE → HEX list",
  fromMime: ["application/octet-stream"],
  accept: [".ase"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const palette = parseAse(await input.arrayBuffer());
      out = buildHexList(palette);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ASE to HEX list",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default aseToHex;
