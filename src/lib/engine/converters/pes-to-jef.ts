import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildJef, parsePes } from "../util/embroidery";

const pesToJef: Converter = {
  id: "pes-to-jef",
  label: "PES → JEF",
  fromMime: ["application/x-pes", "application/octet-stream"],
  accept: [".pes"],
  toMime: "application/x-jef",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parsePes(await input.arrayBuffer());
      buf = buildJef(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert PES to JEF", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-jef" }), filename: swapExtension(input.name, "jef") };
  },
};

export default pesToJef;
