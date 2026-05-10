import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildDst, parseExp } from "../util/embroidery";

const expToDst: Converter = {
  id: "exp-to-dst",
  label: "EXP → DST",
  fromMime: ["application/x-exp", "application/octet-stream"],
  accept: [".exp"],
  toMime: "application/x-tajima-dst",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseExp(await input.arrayBuffer());
      buf = buildDst(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert EXP to DST", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-tajima-dst" }), filename: swapExtension(input.name, "dst") };
  },
};

export default expToDst;
