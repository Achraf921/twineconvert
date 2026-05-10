import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseThreeMf } from "../util/mesh";
import { buildObj } from "../util/obj-build";

const threeMfToObj: Converter = {
  id: "3mf-to-obj",
  label: "3MF → OBJ",
  fromMime: ["model/3mf", "application/zip"],
  accept: [".3mf"],
  toMime: "model/obj",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let obj: string;
    try {
      const mesh = await parseThreeMf(input);
      opts?.onProgress?.(0.6);
      obj = buildObj(mesh);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert 3MF to OBJ", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([obj], { type: "model/obj" }),
      filename: swapExtension(input.name, "obj"),
    };
  },
};

export default threeMfToObj;
