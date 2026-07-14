import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGlb } from "../util/gltf";
import { buildThreeMf } from "../util/mesh";

/**
 * GLB to 3MF. Node transforms are baked and every triangle primitive is merged; materials and animations are not carried over into plain geometry targets.
 */
const glbToThreeMf: Converter = {
  id: "glb-to-3mf",
  label: "GLB → 3MF",
  fromMime: ["model/gltf-binary", "application/octet-stream"],
  accept: [".glb"],
  toMime: "model/3mf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseGlb(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const blobOut = await buildThreeMf(mesh);
      blob = blobOut;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GLB to 3MF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "3mf") };
  },
};

export default glbToThreeMf;
