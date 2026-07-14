import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFromDae } from "../util/three-mesh";
import { buildObj } from "../util/obj-build";

/**
 * DAE to OBJ. COLLADA geometry is flattened through node transforms and merged; materials and animations are not carried over.
 */
const daeToObj: Converter = {
  id: "dae-to-obj",
  label: "DAE → OBJ",
  fromMime: ["model/vnd.collada+xml", "application/xml", "text/xml"],
  accept: [".dae"],
  toMime: "model/obj",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFromDae(await input.text());
      opts?.onProgress?.(0.6);
      const out = buildObj(mesh);
      blob = new Blob([out], { type: "model/obj;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DAE to OBJ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "obj") };
  },
};

export default daeToObj;
