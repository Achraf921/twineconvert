import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildCsp, parseCube } from "../util/lut";

const cubeToCsp: Converter = {
  id: "cube-to-csp",
  label: "CUBE → CSP",
  fromMime: ["text/plain"],
  accept: [".cube"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const lut = parseCube(await input.text());
      out = buildCsp(lut);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert CUBE to CSP", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "csp") };
  },
};

export default cubeToCsp;
