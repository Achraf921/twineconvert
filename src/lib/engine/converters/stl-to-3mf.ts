import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildThreeMf, parseStl } from "../util/mesh";

const stlTo3mf: Converter = {
  id: "stl-to-3mf",
  label: "STL → 3MF",
  fromMime: ["model/stl", "application/sla"],
  accept: [".stl"],
  toMime: "model/3mf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseStl(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      blob = await buildThreeMf(mesh);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert STL to 3MF", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "3mf") };
  },
};

export default stlTo3mf;
