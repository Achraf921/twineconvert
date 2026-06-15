import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseDicom, dicomPixelsToRgba } from "../util/dicom";

/**
 * dicom-to-png. Renders the first frame of a DICOM file as a PNG by
 * decoding the uncompressed pixel data, applying window/level (using
 * the file's metadata if present, auto-computed min/max otherwise),
 * and emitting via canvas.toBlob.
 *
 * The conversion runs entirely client-side in the browser tab, which
 * matters for HIPAA compliance — no patient data ever crosses the
 * network, unlike upload-based DICOM viewers.
 */
const dicomToPng: Converter = {
  id: "dicom-to-png",
  label: "DICOM → PNG",
  fromMime: ["application/dicom", "application/octet-stream"],
  // Real DICOM files from CDs/PACS are often extensionless or numerically
  // named (IM1, IM2, I0000001). Accept any file and validate by the DICM
  // magic bytes in parseDicom, so those real-world files aren't rejected
  // at the extension gate (PostHog: 54 failed IM* uploads, 0 successes).
  accept: [".dcm", ".dicom", "*"],
  toMime: "image/png",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let pngBlob: Blob;
    try {
      const file = parseDicom(await input.arrayBuffer());
      const { rgba, width, height } = dicomPixelsToRgba(file);
      opts?.onProgress?.(0.5);

      // OffscreenCanvas is the modern preferred path (works in workers
      // too); fall back to a regular HTMLCanvasElement for older browsers.
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
      // Use createImageData + .set() rather than the ImageData
      // constructor — Next.js's strict TS lib doesn't expose the
      // (data, sw, sh) overload of new ImageData here, and creating
      // through the context is also slightly faster on Chromium.
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      pngBlob = await canvasToPngBlob(canvas);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DICOM to PNG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: pngBlob,
      filename: swapExtension(input.name, "png"),
    };
  },
};

async function canvasToPngBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/png" });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))), "image/png");
  });
}

export default dicomToPng;
