import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { canvasEncode } from "../util/canvas-encode";
import { imagesToPdf, pdfFilename } from "../util/image-to-pdf";

/**
 * WebP → PDF. pdf-lib only embeds JPEG/PNG natively, so we transcode the
 * WebP to JPEG first via Canvas, then embed.
 */
const webpToPdf: Converter = {
  id: "webp-to-pdf",
  label: "WebP → PDF",
  fromMime: ["image/webp"],
  toMime: "application/pdf",
  accept: [".webp"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let jpgBlob: Blob;
    try {
      jpgBlob = await canvasEncode(input, {
        toMime: "image/jpeg",
        quality: 0.92,
        background: "#ffffff",
      });
    } catch (err) {
      throw new ConvertFailedError("Could not transcode WebP for PDF embed", err);
    }
    opts?.onProgress?.(0.6);
    const blob = await imagesToPdf([jpgBlob], { embedType: "image/jpeg" });
    opts?.onProgress?.(1);
    return { blob, filename: pdfFilename(input.name) };
  },
};

export default webpToPdf;
