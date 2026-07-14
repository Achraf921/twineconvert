import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseStl } from "../util/mesh";
import { buildUsdz } from "../util/three-mesh";

/**
 * STL to USDZ. Reads binary and ascii STL.
 */
const stlToUsdz: Converter = {
  id: "stl-to-usdz",
  label: "STL → USDZ",
  fromMime: ["model/stl", "application/octet-stream"],
  accept: [".stl"],
  toMime: "model/vnd.usdz+zip",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseStl(await input.arrayBuffer());
      if (mesh.triangles.length === 0) throw new Error("STL contains no triangles");
      opts?.onProgress?.(0.6);
      const blobOut = await buildUsdz(mesh);
      blob = blobOut;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert STL to USDZ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "usdz") };
  },
};

export default stlToUsdz;
