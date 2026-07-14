import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { glbToGltfJson } from "../util/gltf";

/**
 * GLB to glTF, as a LOSSLESS container repack rather than a geometry
 * extraction: the BIN chunk becomes an embedded base64 data-URI buffer and
 * everything else (materials, animations, skins, extensions) is preserved
 * verbatim. The result is a single self-contained .gltf JSON file.
 */
const glbToGltf: Converter = {
  id: "glb-to-gltf",
  label: "GLB → glTF",
  fromMime: ["model/gltf-binary", "application/octet-stream"],
  accept: [".glb"],
  toMime: "model/gltf+json",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const out = glbToGltfJson(await input.arrayBuffer());
      blob = new Blob([out], { type: "model/gltf+json;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GLB to glTF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "gltf") };
  },
};

export default glbToGltf;
