import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGltfJson } from "../util/gltf";
import { buildPly } from "../util/ply";

/**
 * glTF to PLY. Requires a self-contained .gltf (embedded data-URI buffers); node transforms are baked and every triangle primitive is merged.
 */
const gltfToPly: Converter = {
  id: "gltf-to-ply",
  label: "glTF → PLY",
  fromMime: ["model/gltf+json", "application/json"],
  accept: [".gltf"],
  toMime: "model/ply",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseGltfJson(await input.text());
      opts?.onProgress?.(0.6);
      const out = buildPly(mesh);
      blob = new Blob([out], { type: "model/ply;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert glTF to PLY",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "ply") };
  },
};

export default gltfToPly;
