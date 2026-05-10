import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { build3dl, parseCsp } from "../util/lut";

const cspTo3dl: Converter = {
  id: "csp-to-3dl",
  label: "CSP → 3DL",
  fromMime: ["text/plain"],
  accept: [".csp"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const lut = parseCsp(await input.text());
      out = build3dl(lut);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert CSP to 3DL", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "3dl") };
  },
};

export default cspTo3dl;
