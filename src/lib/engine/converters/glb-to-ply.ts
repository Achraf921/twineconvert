import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGlb } from "../util/gltf";
import { buildPly } from "../util/ply";

/**
 * GLB to PLY. Node transforms are baked and every triangle primitive is merged; materials and animations are not carried over into plain geometry targets.
 */
const glbToPly: Converter = {
  id: "glb-to-ply",
  label: "GLB → PLY",
  fromMime: ["model/gltf-binary", "application/octet-stream"],
  accept: [".glb"],
  toMime: "model/ply",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseGlb(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const out = buildPly(mesh);
      blob = new Blob([out], { type: "model/ply;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GLB to PLY",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "ply") };
  },
};

export default glbToPly;
