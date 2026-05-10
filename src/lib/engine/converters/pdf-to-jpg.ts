import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { canvasToBlob, renderPdfPage } from "../util/pdf-render";

/**
 * PDF → JPG. Returns the FIRST PAGE rendered as JPEG.
 *
 * Multi-page PDF→JPG (returning a ZIP of per-page JPEGs) is a separate
 * tool that lives later — most users searching "pdf to jpg" want a quick
 * cover-page render of a single-page document.
 */
const pdfToJpg: Converter = {
  id: "pdf-to-jpg",
  label: "PDF → JPG",
  fromMime: ["application/pdf"],
  toMime: "image/jpeg",
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
        "Could not render PDF — file may be corrupt or password-protected",
        err,
      );
    }
    opts?.onProgress?.(0.7);
    const blob = await canvasToBlob(canvas, "image/jpeg", opts?.quality ?? 0.92);
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "jpg") };
  },
};

export default pdfToJpg;
