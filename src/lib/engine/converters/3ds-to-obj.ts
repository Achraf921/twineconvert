import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFrom3ds } from "../util/three-mesh";
import { buildObj } from "../util/obj-build";

/**
 * 3DS to OBJ. All tri-mesh objects in the 3DS file are merged; materials are not carried over.
 */
const threeDsToObj: Converter = {
  id: "3ds-to-obj",
  label: "3DS → OBJ",
  fromMime: ["application/x-3ds", "image/x-3ds", "application/octet-stream"],
  accept: [".3ds"],
  toMime: "model/obj",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFrom3ds(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const out = buildObj(mesh);
      blob = new Blob([out], { type: "model/obj;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert 3DS to OBJ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "obj") };
  },
};

export default threeDsToObj;
