import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseObj } from "../util/mesh";
import { buildGltfJson } from "../util/gltf";

/**
 * OBJ to glTF. Geometry only: v and f records are read, materials (.mtl) and texture coordinates are not needed by the target format.
 */
const objToGltf: Converter = {
  id: "obj-to-gltf",
  label: "OBJ → glTF",
  fromMime: ["model/obj", "text/plain"],
  accept: [".obj"],
  toMime: "model/gltf+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseObj(await input.text());
      if (mesh.triangles.length === 0) throw new Error("OBJ contains no faces");
      opts?.onProgress?.(0.6);
      const out = buildGltfJson(mesh);
      blob = new Blob([out], { type: "model/gltf+json;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert OBJ to glTF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gltf") };
  },
};

export default objToGltf;
