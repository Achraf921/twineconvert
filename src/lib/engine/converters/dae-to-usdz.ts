import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFromDae, buildUsdz } from "../util/three-mesh";

/**
 * DAE to USDZ. COLLADA geometry is flattened through node transforms and merged; materials and animations are not carried over.
 */
const daeToUsdz: Converter = {
  id: "dae-to-usdz",
  label: "DAE → USDZ",
  fromMime: ["model/vnd.collada+xml", "application/xml", "text/xml"],
  accept: [".dae"],
  toMime: "model/vnd.usdz+zip",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFromDae(await input.text());
      opts?.onProgress?.(0.6);
      const blobOut = await buildUsdz(mesh);
      blob = blobOut;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DAE to USDZ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "usdz") };
  },
};

export default daeToUsdz;
