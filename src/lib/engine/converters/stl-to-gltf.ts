import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseStl } from "../util/mesh";
import { buildGltfJson } from "../util/gltf";

/**
 * STL to glTF. Reads binary and ascii STL.
 */
const stlToGltf: Converter = {
  id: "stl-to-gltf",
  label: "STL → glTF",
  fromMime: ["model/stl", "application/octet-stream"],
  accept: [".stl"],
  toMime: "model/gltf+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseStl(await input.arrayBuffer());
      if (mesh.triangles.length === 0) throw new Error("STL contains no triangles");
      opts?.onProgress?.(0.6);
      const out = buildGltfJson(mesh);
      blob = new Blob([out], { type: "model/gltf+json;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert STL to glTF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gltf") };
  },
};

export default stlToGltf;
