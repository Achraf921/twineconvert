import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildCube, parse3dl } from "../util/lut";

const threeDlToCube: Converter = {
  id: "3dl-to-cube",
  label: "3DL → CUBE",
  fromMime: ["text/plain"],
  accept: [".3dl"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const lut = parse3dl(await input.text());
      out = buildCube(lut);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert 3DL to CUBE", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "cube") };
  },
};

export default threeDlToCube;
