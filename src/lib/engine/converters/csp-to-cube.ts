import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildCube, parseCsp } from "../util/lut";

const cspToCube: Converter = {
  id: "csp-to-cube",
  label: "CSP → CUBE",
  fromMime: ["text/plain"],
  accept: [".csp"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const lut = parseCsp(await input.text());
      out = buildCube(lut);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert CSP to CUBE", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "cube") };
  },
};

export default cspToCube;
