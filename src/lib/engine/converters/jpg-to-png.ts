import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const jpgToPng: Converter = {
  id: "jpg-to-png",
  label: "JPG → PNG",
  fromMime: ["image/jpeg"],
  toMime: "image/png",
  accept: [".jpg", ".jpeg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const blob = await canvasEncode(input, { toMime: "image/png" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default jpgToPng;
