import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGltfJson } from "../util/gltf";
import { buildObj } from "../util/obj-build";

/**
 * glTF to OBJ. Requires a self-contained .gltf (embedded data-URI buffers); node transforms are baked and every triangle primitive is merged.
 */
const gltfToObj: Converter = {
  id: "gltf-to-obj",
  label: "glTF → OBJ",
  fromMime: ["model/gltf+json", "application/json"],
  accept: [".gltf"],
  toMime: "model/obj",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseGltfJson(await input.text());
      opts?.onProgress?.(0.6);
      const out = buildObj(mesh);
      blob = new Blob([out], { type: "model/obj;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert glTF to OBJ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "obj") };
  },
};

export default gltfToObj;
