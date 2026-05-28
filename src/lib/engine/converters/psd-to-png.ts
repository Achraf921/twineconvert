import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * PSD → PNG. Flattens the Photoshop composite to a PNG via ag-psd
 * (pure-JS Photoshop reader, no Photoshop install needed). The output
 * is the rendered composite, not individual layers; if you need layer
 * extraction that is a different shape and a separate tool.
 *
 * Canvas-only: runs in the browser and the Playwright browser tests,
 * never server-side.
 */
const psdToPng: Converter = {
  id: "psd-to-png",
  label: "PSD → PNG",
  fromMime: ["image/vnd.adobe.photoshop", "application/x-photoshop", "application/octet-stream"],
  accept: [".psd"],
  toMime: "image/png",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const { readPsd } = await import("ag-psd");
      const ab = await input.arrayBuffer();
      const psd = readPsd(ab, { skipLayerImageData: true, skipThumbnail: true });
      opts?.onProgress?.(0.6);
      const canvas = (psd as { canvas?: HTMLCanvasElement }).canvas;
      if (!canvas) {
        throw new Error(
          "PSD has no composite image (likely a layer-only document saved without 'Maximize Compatibility'). Re-save in Photoshop with the Maximize Compatibility option enabled and try again.",
        );
      }
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (!b) {
            reject(new Error("Canvas could not encode PNG"));
            return;
          }
          resolve(b);
        }, "image/png");
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PSD to PNG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default psdToPng;
