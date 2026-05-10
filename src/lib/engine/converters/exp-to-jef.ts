import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildJef, parseExp } from "../util/embroidery";

const expToJef: Converter = {
  id: "exp-to-jef",
  label: "EXP → JEF",
  fromMime: ["application/x-exp", "application/octet-stream"],
  accept: [".exp"],
  toMime: "application/x-jef",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseExp(await input.arrayBuffer());
      buf = buildJef(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert EXP to JEF", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-jef" }), filename: swapExtension(input.name, "jef") };
  },
};

export default expToJef;
