import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { parseDicom, loadDicomPixels, dicomPixelsToRgba } from "../util/dicom";
import { imagesToPdf, pdfFilename } from "../util/image-to-pdf";

/**
 * DICOM → PDF. Decodes the DICOM pixel buffer the same way as
 * dicom-to-png (window/level + RGBA buffer), encodes it to PNG via
 * canvas, then wraps that PNG into a single-page PDF with our existing
 * imagesToPdf helper. End result is a printable / archivable PDF of
 * the medical image, useful for clinical reports and patient handouts.
 *
 * Same HIPAA story as dicom-to-png/jpg: everything happens in the
 * browser tab; no patient data leaves the device.
 */
const dicomToPdf: Converter = {
  id: "dicom-to-pdf",
  label: "DICOM → PDF",
  fromMime: ["application/dicom", "application/octet-stream"],
  // Real DICOM files are often extensionless / numerically named (IM1,
  // I0000001); accept any file and validate by the DICM magic bytes.
  accept: [".dcm", ".dicom", "*"],
  toMime: "application/pdf",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let pdfBlob: Blob;
    try {
      const file = await loadDicomPixels(parseDicom(await input.arrayBuffer()));
      const { rgba, width, height } = dicomPixelsToRgba(file);
      opts?.onProgress?.(0.4);

      let canvas: HTMLCanvasElement | OffscreenCanvas;
      if (typeof OffscreenCanvas !== "undefined") {
        canvas = new OffscreenCanvas(width, height);
      } else {
        const el = document.createElement("canvas");
        el.width = width;
        el.height = height;
        canvas = el;
      }
      const ctx = canvas.getContext("2d") as
        | CanvasRenderingContext2D
        | OffscreenCanvasRenderingContext2D
        | null;
      if (!ctx) throw new Error("Could not acquire 2D canvas context");
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      const pngBlob = await canvasToPng(canvas);
      opts?.onProgress?.(0.7);
      pdfBlob = await imagesToPdf([pngBlob], { embedType: "image/png" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DICOM to PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob: pdfBlob, filename: pdfFilename(input.name) };
  },
};

async function canvasToPng(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/png" });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/png",
    );
  });
}

export default dicomToPdf;
