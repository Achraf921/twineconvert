import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseStl } from "../util/mesh";
import { buildObj } from "../util/obj-build";

const stlToObj: Converter = {
  id: "stl-to-obj",
  label: "STL → OBJ",
  fromMime: ["model/stl", "application/sla"],
  accept: [".stl"],
  toMime: "model/obj",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let obj: string;
    try {
      const mesh = parseStl(await input.arrayBuffer());
      opts?.onProgress?.(0.6);
      obj = buildObj(mesh);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert STL to OBJ", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([obj], { type: "model/obj" }),
      filename: swapExtension(input.name, "obj"),
    };
  },
};

export default stlToObj;
