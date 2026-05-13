import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGlb } from "../util/gltf";
import { buildObj } from "../util/obj-build";

const glbToObj: Converter = {
  id: "glb-to-obj",
  label: "GLB → OBJ",
  fromMime: ["model/gltf-binary", "application/octet-stream"],
  accept: [".glb"],
  toMime: "model/obj",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let obj: string;
    try {
      const mesh = parseGlb(await input.arrayBuffer());
      if (mesh.vertices.length === 0) throw new Error("GLB contains no mesh vertices");
      obj = buildObj(mesh);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GLB to OBJ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([obj], { type: "model/obj;charset=utf-8" }),
      filename: swapExtension(input.name, "obj"),
    };
  },
};

export default glbToObj;
