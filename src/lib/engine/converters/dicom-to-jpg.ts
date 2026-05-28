import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseDicom, dicomPixelsToRgba } from "../util/dicom";

/**
 * DICOM → JPG. Same medical-imaging decode path as dicom-to-png with
 * a smaller, mail-friendly JPEG output. The DICOM pixel buffer is
 * window/levelled (using the file's metadata if present, auto-computed
 * min/max otherwise) and flattened onto a white background since JPEG
 * cannot store the implicit transparent areas at the image edges.
 *
 * The conversion runs entirely client-side, no patient data crosses
 * the network. Same HIPAA story as dicom-to-png.
 */
const dicomToJpg: Converter = {
  id: "dicom-to-jpg",
  label: "DICOM → JPG",
  fromMime: ["application/dicom", "application/octet-stream"],
  accept: [".dcm", ".dicom"],
  toMime: "image/jpeg",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let jpegBlob: Blob;
    try {
      const file = parseDicom(await input.arrayBuffer());
      const { rgba, width, height } = dicomPixelsToRgba(file);
      opts?.onProgress?.(0.5);

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
      // White background under the DICOM pixels for the JPEG flatten.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      jpegBlob = await canvasToJpegBlob(canvas, 0.92);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DICOM to JPG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob: jpegBlob, filename: swapExtension(input.name, "jpg") };
  },
};

async function canvasToJpegBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number,
): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/jpeg",
      quality,
    );
  });
}

export default dicomToJpg;
