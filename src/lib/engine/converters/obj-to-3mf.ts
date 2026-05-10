import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildThreeMf, parseObj } from "../util/mesh";

const objTo3mf: Converter = {
  id: "obj-to-3mf",
  label: "OBJ → 3MF",
  fromMime: ["model/obj", "text/plain"],
  accept: [".obj"],
  toMime: "model/3mf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseObj(await input.text());
      opts?.onProgress?.(0.6);
      blob = await buildThreeMf(mesh);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert OBJ to 3MF", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "3mf") };
  },
};

export default objTo3mf;
