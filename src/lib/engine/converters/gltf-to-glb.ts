import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { gltfJsonToGlb } from "../util/gltf";

/**
 * glTF to GLB, as a LOSSLESS container repack rather than a geometry
 * extraction: materials, animations, skins, cameras, and extensions are
 * preserved verbatim while the embedded data-URI buffers are merged into the
 * single GLB BIN chunk. Files that reference external .bin or texture files
 * get an actionable error since a browser upload has no access to them.
 */
const gltfToGlb: Converter = {
  id: "gltf-to-glb",
  label: "glTF → GLB",
  fromMime: ["model/gltf+json", "application/json"],
  accept: [".gltf"],
  toMime: "model/gltf-binary",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const out = gltfJsonToGlb(await input.text());
      blob = new Blob([out], { type: "model/gltf-binary" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert glTF to GLB",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "glb") };
  },
};

export default gltfToGlb;
