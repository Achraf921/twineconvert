import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildJef, parseDst } from "../util/embroidery";

const dstToJef: Converter = {
  id: "dst-to-jef",
  label: "DST → JEF (Janome)",
  fromMime: ["application/x-tajima-dst", "application/octet-stream"],
  accept: [".dst"],
  toMime: "application/x-jef",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const design = parseDst(await input.arrayBuffer());
      buf = buildJef(design);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert DST to JEF", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/x-jef" }), filename: swapExtension(input.name, "jef") };
  },
};

export default dstToJef;
