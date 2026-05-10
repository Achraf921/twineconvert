import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildPes, parseExp } from "../util/embroidery";

const expToPes: Converter = {
  id: "exp-to-pes",
  label: "EXP → PES",
  fromMime: ["application/x-exp", "application/octet-stream"],
  accept: [".exp"],
  toMime: "application/x-pes",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseExp(await input.arrayBuffer());
      buf = buildPes(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert EXP to PES", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-pes" }), filename: swapExtension(input.name, "pes") };
  },
};

export default expToPes;
