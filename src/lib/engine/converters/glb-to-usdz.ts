import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGlb } from "../util/gltf";
import { buildUsdz } from "../util/three-mesh";

/**
 * GLB to USDZ. Node transforms are baked and every triangle primitive is merged; materials and animations are not carried over into plain geometry targets.
 */
const glbToUsdz: Converter = {
  id: "glb-to-usdz",
  label: "GLB → USDZ",
  fromMime: ["model/gltf-binary", "application/octet-stream"],
  accept: [".glb"],
  toMime: "model/vnd.usdz+zip",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseGlb(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const blobOut = await buildUsdz(mesh);
      blob = blobOut;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GLB to USDZ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "usdz") };
  },
};

export default glbToUsdz;
