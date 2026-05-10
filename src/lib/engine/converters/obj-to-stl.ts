import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildBinaryStl, parseObj } from "../util/mesh";

const objToStl: Converter = {
  id: "obj-to-stl",
  label: "OBJ → STL",
  fromMime: ["model/obj", "text/plain"],
  accept: [".obj"],
  toMime: "model/stl",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const mesh = parseObj(await input.text());
      opts?.onProgress?.(0.6);
      const buf = buildBinaryStl(mesh);
      blob = new Blob([buf], { type: "model/stl" });
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert OBJ to STL", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "stl") };
  },
};

export default objToStl;
