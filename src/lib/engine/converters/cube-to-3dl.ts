import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { build3dl, parseCube } from "../util/lut";

const cubeTo3dl: Converter = {
  id: "cube-to-3dl",
  label: "CUBE → 3DL",
  fromMime: ["text/plain", "application/x-cube-lut"],
  accept: [".cube"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const lut = parseCube(await input.text());
      out = build3dl(lut);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert CUBE to 3DL", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "3dl") };
  },
};

export default cubeTo3dl;
