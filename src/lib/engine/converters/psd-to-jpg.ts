import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * PSD → JPG. Flattens the Photoshop composite to a JPEG (white
 * background under any transparency, JPEG cannot store an alpha
 * channel). Same ag-psd path as psd-to-png; choose JPG when you
 * want a smaller file for sharing and the transparency loss is OK.
 */
const psdToJpg: Converter = {
  id: "psd-to-jpg",
  label: "PSD → JPG",
  fromMime: ["image/vnd.adobe.photoshop", "application/x-photoshop", "application/octet-stream"],
  accept: [".psd"],
  toMime: "image/jpeg",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const { readPsd } = await import("ag-psd");
      const ab = await input.arrayBuffer();
      const psd = readPsd(ab, { skipLayerImageData: true, skipThumbnail: true });
      opts?.onProgress?.(0.6);
      const srcCanvas = (psd as { canvas?: HTMLCanvasElement }).canvas;
      if (!srcCanvas) {
        throw new Error(
          "PSD has no composite image (likely a layer-only document saved without 'Maximize Compatibility'). Re-save in Photoshop with the Maximize Compatibility option enabled and try again.",
        );
      }
      // Flatten onto a white background since JPEG has no alpha. Without
      // this, any transparent area would render as black.
      const flat = document.createElement("canvas");
      flat.width = srcCanvas.width;
      flat.height = srcCanvas.height;
      const ctx = flat.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, flat.width, flat.height);
      ctx.drawImage(srcCanvas, 0, 0);
      blob = await new Promise<Blob>((resolve, reject) => {
        flat.toBlob(
          (b) => {
            if (!b) {
              reject(new Error("Canvas could not encode JPEG"));
              return;
            }
            resolve(b);
          },
          "image/jpeg",
          0.92,
        );
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PSD to JPG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default psdToJpg;
