import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { canvasToBlob } from "../util/pdf-render";
import { decodeTiff, imageDataToCanvas } from "../util/tiff-decode";

const tiffToJpg: Converter = {
  id: "tiff-to-jpg",
  label: "TIFF → JPG",
  fromMime: ["image/tiff", "image/x-tiff"],
  toMime: "image/jpeg",
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
    const blob = await canvasToBlob(canvas, "image/jpeg", opts?.quality ?? 0.92);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default tiffToJpg;
