import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildPes, parseJef } from "../util/embroidery";

const jefToPes: Converter = {
  id: "jef-to-pes",
  label: "JEF → PES",
  fromMime: ["application/x-jef", "application/octet-stream"],
  accept: [".jef"],
  toMime: "application/x-pes",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseJef(await input.arrayBuffer());
      buf = buildPes(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert JEF to PES", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-pes" }), filename: swapExtension(input.name, "pes") };
  },
};

export default jefToPes;
