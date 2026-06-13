import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { canvasToBlob } from "../util/pdf-render";
import { decodeTiff, imageDataToCanvas } from "../util/tiff-decode";

/**
 * TIFF → WebP. Decodes the TIFF (utif) into a canvas, then re-encodes to
 * WebP, which is 25 to 35 percent smaller than the equivalent PNG and
 * supported everywhere on the modern web. Same decode path as tiff-to-png.
 */
const tiffToWebp: Converter = {
  id: "tiff-to-webp",
  label: "TIFF → WebP",
  fromMime: ["image/tiff", "image/x-tiff"],
  toMime: "image/webp",
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
        "TIFF decode failed, file may be corrupt or use an unsupported TIFF compression",
        err,
      );
    }
    opts?.onProgress?.(0.7);
    const blob = await canvasToBlob(canvas, "image/webp", opts?.quality ?? 0.9);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "webp") };
  },
};

export default tiffToWebp;
