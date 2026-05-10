import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildExp, parseJef } from "../util/embroidery";

const jefToExp: Converter = {
  id: "jef-to-exp",
  label: "JEF → EXP",
  fromMime: ["application/x-jef", "application/octet-stream"],
  accept: [".jef"],
  toMime: "application/x-exp",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseJef(await input.arrayBuffer());
      buf = buildExp(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert JEF to EXP", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-exp" }), filename: swapExtension(input.name, "exp") };
  },
};

export default jefToExp;
