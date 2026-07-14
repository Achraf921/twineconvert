import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGltfJson } from "../util/gltf";
import { buildUsdz } from "../util/three-mesh";

/**
 * glTF to USDZ. Requires a self-contained .gltf (embedded data-URI buffers); node transforms are baked and every triangle primitive is merged.
 */
const gltfToUsdz: Converter = {
  id: "gltf-to-usdz",
  label: "glTF → USDZ",
  fromMime: ["model/gltf+json", "application/json"],
  accept: [".gltf"],
  toMime: "model/vnd.usdz+zip",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseGltfJson(await input.text());
      opts?.onProgress?.(0.6);
      const blobOut = await buildUsdz(mesh);
      blob = blobOut;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert glTF to USDZ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "usdz") };
  },
};

export default gltfToUsdz;
