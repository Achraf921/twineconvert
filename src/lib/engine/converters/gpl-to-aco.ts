import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAco, parseGpl } from "../util/palette";

const gplToAco: Converter = {
  id: "gpl-to-aco",
  label: "GPL → ACO",
  fromMime: ["text/plain"],
  accept: [".gpl"],
  toMime: "application/octet-stream",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const palette = parseGpl(await input.text());
      buf = buildAco(palette);
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert GPL to ACO", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([buf], { type: "application/octet-stream" }), filename: swapExtension(input.name, "aco") };
  },
};

export default gplToAco;
