import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { imagesToPdf, pdfFilename } from "../util/image-to-pdf";

const pngToPdf: Converter = {
  id: "png-to-pdf",
  label: "PNG → PDF",
  fromMime: ["image/png"],
  toMime: "application/pdf",
  accept: [".png"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      blob = await imagesToPdf([input], { embedType: "image/png" });
    } catch (err) {
      throw new ConvertFailedError("Could not embed PNG into PDF", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: pdfFilename(input.name) };
  },
};

export default pngToPdf;
