import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePly } from "../util/ply";
import { buildBinaryStl } from "../util/mesh";

/**
 * PLY to STL. Reads ascii and binary PLY (both endiannesses); extra per-vertex properties like normals and colors are dropped since the target holds plain geometry.
 */
const plyToStl: Converter = {
  id: "ply-to-stl",
  label: "PLY → STL",
  fromMime: ["application/octet-stream", "text/plain"],
  accept: [".ply"],
  toMime: "model/stl",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parsePly(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      const out = buildBinaryStl(mesh);
      blob = new Blob([out], { type: "model/stl" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PLY to STL",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "stl") };
  },
};

export default plyToStl;
