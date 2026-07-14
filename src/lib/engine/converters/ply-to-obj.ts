import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePly } from "../util/ply";
import { buildObj } from "../util/obj-build";

/**
 * PLY to OBJ. Reads ascii and binary PLY (both endiannesses); extra per-vertex properties like normals and colors are dropped since the target holds plain geometry.
 */
const plyToObj: Converter = {
  id: "ply-to-obj",
  label: "PLY → OBJ",
  fromMime: ["application/octet-stream", "text/plain"],
  accept: [".ply"],
  toMime: "model/obj",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parsePly(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const out = buildObj(mesh);
      blob = new Blob([out], { type: "model/obj;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PLY to OBJ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "obj") };
  },
};

export default plyToObj;
