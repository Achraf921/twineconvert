import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { imagesToPdf, pdfFilename } from "../util/image-to-pdf";

const jpgToPdf: Converter = {
  id: "jpg-to-pdf",
  label: "JPG → PDF",
  fromMime: ["image/jpeg"],
  toMime: "application/pdf",
  accept: [".jpg", ".jpeg"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      blob = await imagesToPdf([input], { embedType: "image/jpeg" });
    } catch (err) {
      throw new ConvertFailedError("Could not embed JPEG into PDF", err);
    }
    opts?.onProgress?.(1);
    return { blob, filename: pdfFilename(input.name) };
  },
};

export default jpgToPdf;
