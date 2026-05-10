import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { canvasToBlob, renderPdfPage } from "../util/pdf-render";

const pdfToPng: Converter = {
  id: "pdf-to-png",
  label: "PDF → PNG",
  fromMime: ["application/pdf"],
  toMime: "image/png",
  accept: [".pdf"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let canvas: HTMLCanvasElement;
    try {
      const rendered = await renderPdfPage(input, { pageNumber: 1, scale: 2 });
      canvas = rendered.canvas;
    } catch (err) {
      throw new ConvertFailedError(
        "Could not render PDF, file may be corrupt or password-protected",
        err,
      );
    }
    opts?.onProgress?.(0.7);
    const blob = await canvasToBlob(canvas, "image/png");
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default pdfToPng;
