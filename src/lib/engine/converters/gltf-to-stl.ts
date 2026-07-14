import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGltfJson } from "../util/gltf";
import { buildBinaryStl } from "../util/mesh";

/**
 * glTF to STL. Requires a self-contained .gltf (embedded data-URI buffers); node transforms are baked and every triangle primitive is merged.
 */
const gltfToStl: Converter = {
  id: "gltf-to-stl",
  label: "glTF → STL",
  fromMime: ["model/gltf+json", "application/json"],
  accept: [".gltf"],
  toMime: "model/stl",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseGltfJson(await input.text());
      opts?.onProgress?.(0.6);
      const out = buildBinaryStl(mesh);
      blob = new Blob([out], { type: "model/stl" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert glTF to STL",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "stl") };
  },
};

export default gltfToStl;
