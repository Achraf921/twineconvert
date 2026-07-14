import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFromFbx } from "../util/three-mesh";
import { buildObj } from "../util/obj-build";

/**
 * FBX to OBJ. FBX geometry (binary or ASCII, version 7000+) is flattened through node transforms and merged; materials, rigs, and animations are not carried over.
 */
const fbxToObj: Converter = {
  id: "fbx-to-obj",
  label: "FBX → OBJ",
  fromMime: ["application/octet-stream"],
  accept: [".fbx"],
  toMime: "model/obj",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFromFbx(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const out = buildObj(mesh);
      blob = new Blob([out], { type: "model/obj;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert FBX to OBJ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "obj") };
  },
};

export default fbxToObj;
