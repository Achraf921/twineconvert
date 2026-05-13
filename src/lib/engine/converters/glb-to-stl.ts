import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGlb } from "../util/gltf";
import { buildBinaryStl } from "../util/mesh";

const glbToStl: Converter = {
  id: "glb-to-stl",
  label: "GLB → STL",
  fromMime: ["model/gltf-binary", "application/octet-stream"],
  accept: [".glb"],
  toMime: "model/stl",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let stl: ArrayBuffer;
    try {
      const mesh = parseGlb(await input.arrayBuffer());
      if (mesh.vertices.length === 0) throw new Error("GLB contains no mesh vertices");
      stl = buildBinaryStl(mesh);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GLB to STL",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([stl], { type: "model/stl" }),
      filename: swapExtension(input.name, "stl"),
    };
  },
};

export default glbToStl;
