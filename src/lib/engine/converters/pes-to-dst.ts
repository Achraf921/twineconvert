import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildDst, parsePes } from "../util/embroidery";

const pesToDst: Converter = {
  id: "pes-to-dst",
  label: "PES → DST (Tajima)",
  fromMime: ["application/x-pes", "application/octet-stream"],
  accept: [".pes"],
  toMime: "application/x-tajima-dst",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parsePes(await input.arrayBuffer());
      buf = buildDst(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert PES to DST", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-tajima-dst" }), filename: swapExtension(input.name, "dst") };
  },
};

export default pesToDst;
