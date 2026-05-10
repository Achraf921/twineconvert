import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { canvasToBlob } from "../util/pdf-render";
import { decodeTiff, imageDataToCanvas } from "../util/tiff-decode";
import { imagesToPdf, pdfFilename } from "../util/image-to-pdf";

/**
 * TIFF → PDF. Decode TIFF → JPEG (in memory) → embed in PDF.
 * pdf-lib only supports JPEG/PNG embed, so the JPEG transcode is required.
 */
const tiffToPdf: Converter = {
  id: "tiff-to-pdf",
  label: "TIFF → PDF",
  fromMime: ["image/tiff", "image/x-tiff"],
  toMime: "application/pdf",
  accept: [".tiff", ".tif"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let jpgBlob: Blob;
    try {
      const decoded = await decodeTiff(input);
      const canvas = imageDataToCanvas(decoded.imageData);
      jpgBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
    } catch (err) {
      throw new ConvertFailedError("TIFF decode failed", err);
    }
    opts?.onProgress?.(0.6);
    const blob = await imagesToPdf([jpgBlob], { embedType: "image/jpeg" });
    opts?.onProgress?.(1);
    return { blob, filename: pdfFilename(input.name) };
  },
};

export default tiffToPdf;
