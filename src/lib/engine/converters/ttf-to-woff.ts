import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { convertFont } from "../util/font";

const ttfToWoff: Converter = {
  id: "ttf-to-woff",
  label: "TTF → WOFF",
  fromMime: ["font/ttf", "application/x-font-ttf", "application/font-sfnt"],
  accept: [".ttf"],
  toMime: "font/woff",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: ArrayBuffer;
    try {
      bytes = await convertFont(await input.arrayBuffer(), "ttf", "woff");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert TTF to WOFF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bytes], { type: "font/woff" }),
      filename: swapExtension(input.name, "woff"),
    };
  },
};

export default ttfToWoff;
