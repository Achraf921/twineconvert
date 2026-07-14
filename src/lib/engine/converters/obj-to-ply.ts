import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseObj } from "../util/mesh";
import { buildPly } from "../util/ply";

/**
 * OBJ to PLY. Geometry only: v and f records are read, materials (.mtl) and texture coordinates are not needed by the target format.
 */
const objToPly: Converter = {
  id: "obj-to-ply",
  label: "OBJ → PLY",
  fromMime: ["model/obj", "text/plain"],
  accept: [".obj"],
  toMime: "model/ply",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseObj(await input.text());
      if (mesh.triangles.length === 0) throw new Error("OBJ contains no faces");
      opts?.onProgress?.(0.6);
      const out = buildPly(mesh);
      blob = new Blob([out], { type: "model/ply;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert OBJ to PLY",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "ply") };
  },
};

export default objToPly;
