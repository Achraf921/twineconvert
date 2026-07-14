import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFromDae } from "../util/three-mesh";
import { buildGlb } from "../util/gltf";

/**
 * DAE to GLB. COLLADA geometry is flattened through node transforms and merged; materials and animations are not carried over.
 */
const daeToGlb: Converter = {
  id: "dae-to-glb",
  label: "DAE → GLB",
  fromMime: ["model/vnd.collada+xml", "application/xml", "text/xml"],
  accept: [".dae"],
  toMime: "model/gltf-binary",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFromDae(await input.text());
      opts?.onProgress?.(0.6);
      const out = buildGlb(mesh);
      blob = new Blob([out], { type: "model/gltf-binary" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DAE to GLB",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "glb") };
  },
};

export default daeToGlb;
