import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseStl } from "../util/mesh";
import { buildGlb } from "../util/gltf";

const stlToGlb: Converter = {
  id: "stl-to-glb",
  label: "STL → GLB",
  fromMime: ["model/stl", "application/sla", "application/octet-stream"],
  accept: [".stl"],
  toMime: "model/gltf-binary",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let glb: ArrayBuffer;
    try {
      const mesh = parseStl(await input.arrayBuffer());
      if (mesh.vertices.length === 0) throw new Error("STL file contains no triangles");
      glb = buildGlb(mesh);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert STL to GLB",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([glb], { type: "model/gltf-binary" }),
      filename: swapExtension(input.name, "glb"),
    };
  },
};

export default stlToGlb;
