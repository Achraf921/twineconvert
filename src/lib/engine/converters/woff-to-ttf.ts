import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { convertFont } from "../util/font";

const woffToTtf: Converter = {
  id: "woff-to-ttf",
  label: "WOFF → TTF",
  fromMime: ["font/woff", "application/font-woff"],
  accept: [".woff"],
  toMime: "font/ttf",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: ArrayBuffer;
    try {
      bytes = await convertFont(await input.arrayBuffer(), "woff", "ttf");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert WOFF to TTF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bytes], { type: "font/ttf" }),
      filename: swapExtension(input.name, "ttf"),
    };
  },
};

export default woffToTtf;
