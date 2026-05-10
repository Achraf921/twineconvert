import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { canvasToBlob } from "../util/pdf-render";
import { decodeTiff, imageDataToCanvas } from "../util/tiff-decode";

const tiffToPng: Converter = {
  id: "tiff-to-png",
  label: "TIFF → PNG",
  fromMime: ["image/tiff", "image/x-tiff"],
  toMime: "image/png",
  accept: [".tiff", ".tif"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let canvas: HTMLCanvasElement;
    try {
      const decoded = await decodeTiff(input);
      canvas = imageDataToCanvas(decoded.imageData);
    } catch (err) {
      throw new ConvertFailedError(
        "TIFF decode failed — file may be corrupt or use an unsupported TIFF compression",
        err,
      );
    }
    opts?.onProgress?.(0.7);
    const blob = await canvasToBlob(canvas, "image/png");
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default tiffToPng;
