import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFromFbx } from "../util/three-mesh";
import { buildGlb } from "../util/gltf";

/**
 * FBX to GLB. FBX geometry (binary or ASCII, version 7000+) is flattened through node transforms and merged; materials, rigs, and animations are not carried over.
 */
const fbxToGlb: Converter = {
  id: "fbx-to-glb",
  label: "FBX → GLB",
  fromMime: ["application/octet-stream"],
  accept: [".fbx"],
  toMime: "model/gltf-binary",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFromFbx(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const out = buildGlb(mesh);
      blob = new Blob([out], { type: "model/gltf-binary" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert FBX to GLB",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "glb") };
  },
};

export default fbxToGlb;
