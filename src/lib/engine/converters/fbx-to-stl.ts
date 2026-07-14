import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { meshFromFbx } from "../util/three-mesh";
import { buildBinaryStl } from "../util/mesh";

/**
 * FBX to STL. FBX geometry (binary or ASCII, version 7000+) is flattened through node transforms and merged; materials, rigs, and animations are not carried over.
 */
const fbxToStl: Converter = {
  id: "fbx-to-stl",
  label: "FBX → STL",
  fromMime: ["application/octet-stream"],
  accept: [".fbx"],
  toMime: "model/stl",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = await meshFromFbx(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const out = buildBinaryStl(mesh);
      blob = new Blob([out], { type: "model/stl" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert FBX to STL",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "stl") };
  },
};

export default fbxToStl;
