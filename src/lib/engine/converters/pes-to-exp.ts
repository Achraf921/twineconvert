import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildExp, parsePes } from "../util/embroidery";

const pesToExp: Converter = {
  id: "pes-to-exp",
  label: "PES → EXP",
  fromMime: ["application/x-pes", "application/octet-stream"],
  accept: [".pes"],
  toMime: "application/x-exp",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parsePes(await input.arrayBuffer());
      buf = buildExp(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert PES to EXP", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-exp" }), filename: swapExtension(input.name, "exp") };
  },
};

export default pesToExp;
