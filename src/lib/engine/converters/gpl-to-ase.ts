import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAse, parseGpl } from "../util/palette";

const gplToAse: Converter = {
  id: "gpl-to-ase",
  label: "GPL → ASE (Adobe)",
  fromMime: ["text/plain"],
  accept: [".gpl"],
  toMime: "application/octet-stream",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const palette = parseGpl(await input.text());
      buf = buildAse(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert GPL to ASE", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/octet-stream" }), filename: swapExtension(input.name, "ase") };
  },
};

export default gplToAse;
