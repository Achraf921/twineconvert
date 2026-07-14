import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFromDae } from "../util/three-mesh";
import { buildPly } from "../util/ply";

/**
 * DAE to PLY. COLLADA geometry is flattened through node transforms and merged; materials and animations are not carried over.
 */
const daeToPly: Converter = {
  id: "dae-to-ply",
  label: "DAE → PLY",
  fromMime: ["model/vnd.collada+xml", "application/xml", "text/xml"],
  accept: [".dae"],
  toMime: "model/ply",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFromDae(await input.text());
      opts?.onProgress?.(0.6);
      const out = buildPly(mesh);
      blob = new Blob([out], { type: "model/ply;charset=utf-8" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DAE to PLY",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "ply") };
  },
};

export default daeToPly;
