import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildDst, parseJef } from "../util/embroidery";

const jefToDst: Converter = {
  id: "jef-to-dst",
  label: "JEF → DST",
  fromMime: ["application/x-jef", "application/octet-stream"],
  accept: [".jef"],
  toMime: "application/x-tajima-dst",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseJef(await input.arrayBuffer());
      buf = buildDst(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert JEF to DST", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-tajima-dst" }), filename: swapExtension(input.name, "dst") };
  },
};

export default jefToDst;
