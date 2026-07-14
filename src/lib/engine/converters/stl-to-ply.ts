import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseStl } from "../util/mesh";
import { buildPly } from "../util/ply";

/**
 * STL to PLY. Reads binary and ascii STL.
 */
const stlToPly: Converter = {
  id: "stl-to-ply",
  label: "STL → PLY",
  fromMime: ["model/stl", "application/octet-stream"],
  accept: [".stl"],
  toMime: "model/ply",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseStl(await input.arrayBuffer());
      if (mesh.triangles.length === 0) throw new Error("STL contains no triangles");
      opts?.onProgress?.(0.6);
      const out = buildPly(mesh);
      blob = new Blob([out], { type: "model/ply;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert STL to PLY",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "ply") };
  },
};

export default stlToPly;
