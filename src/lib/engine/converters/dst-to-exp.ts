import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildExp, parseDst } from "../util/embroidery";

const dstToExp: Converter = {
  id: "dst-to-exp",
  label: "DST → EXP (Melco)",
  fromMime: ["application/x-tajima-dst", "application/octet-stream"],
  accept: [".dst"],
  toMime: "application/x-exp",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseDst(await input.arrayBuffer());
      buf = buildExp(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert DST to EXP", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-exp" }), filename: swapExtension(input.name, "exp") };
  },
};

export default dstToExp;
