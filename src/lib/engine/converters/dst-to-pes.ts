import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildPes, parseDst } from "../util/embroidery";

const dstToPes: Converter = {
  id: "dst-to-pes",
  label: "DST → PES (Brother)",
  fromMime: ["application/x-tajima-dst", "application/octet-stream"],
  accept: [".dst"],
  toMime: "application/x-pes",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseDst(await input.arrayBuffer());
      buf = buildPes(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert DST to PES", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-pes" }), filename: swapExtension(input.name, "pes") };
  },
};

export default dstToPes;
