import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseObj } from "../util/mesh";
import { buildGlb } from "../util/gltf";

const objToGlb: Converter = {
  id: "obj-to-glb",
  label: "OBJ → GLB",
  fromMime: ["model/obj", "text/plain"],
  accept: [".obj"],
  toMime: "model/gltf-binary",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let glb: ArrayBuffer;
    try {
      const mesh = parseObj(await input.text());
      if (mesh.vertices.length === 0) throw new Error("OBJ file contains no `v` (vertex) lines");
      glb = buildGlb(mesh);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert OBJ to GLB",
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

export default objToGlb;
