import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFromFbx, buildUsdz } from "../util/three-mesh";

/**
 * FBX to USDZ. FBX geometry (binary or ASCII, version 7000+) is flattened through node transforms and merged; materials, rigs, and animations are not carried over.
 */
const fbxToUsdz: Converter = {
  id: "fbx-to-usdz",
  label: "FBX → USDZ",
  fromMime: ["application/octet-stream"],
  accept: [".fbx"],
  toMime: "model/vnd.usdz+zip",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFromFbx(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const blobOut = await buildUsdz(mesh);
      blob = blobOut;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert FBX to USDZ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "usdz") };
  },
};

export default fbxToUsdz;
