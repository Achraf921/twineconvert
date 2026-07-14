import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePly } from "../util/ply";
import { buildGlb } from "../util/gltf";

/**
 * PLY to GLB. Reads ascii and binary PLY (both endiannesses); extra per-vertex properties like normals and colors are dropped since the target holds plain geometry.
 */
const plyToGlb: Converter = {
  id: "ply-to-glb",
  label: "PLY → GLB",
  fromMime: ["application/octet-stream", "text/plain"],
  accept: [".ply"],
  toMime: "model/gltf-binary",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parsePly(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const out = buildGlb(mesh);
      blob = new Blob([out], { type: "model/gltf-binary" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PLY to GLB",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "glb") };
  },
};

export default plyToGlb;
