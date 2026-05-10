import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { decodeHeic } from "../util/heic-decode";
import { imagesToPdf, pdfFilename } from "../util/image-to-pdf";

/**
 * HEIC → PDF. Two-step: decode HEIC to JPEG (in memory), then embed
 * that JPEG into a PDF. Most "iPhone photo to PDF" workflows want this.
 */
const heicToPdf: Converter = {
  id: "heic-to-pdf",
  label: "HEIC → PDF",
  fromMime: ["image/heic", "image/heif"],
  toMime: "application/pdf",
  accept: [".heic", ".heif"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let jpgBlob: Blob;
    try {
      jpgBlob = await decodeHeic(input, "image/jpeg", 0.92);
    } catch (err) {
      throw new ConvertFailedError(
        "HEIC decode failed, file may be corrupt or use an unsupported HEIC profile",
        err,
      );
    }
    opts?.onProgress?.(0.6);
    const blob = await imagesToPdf([jpgBlob], { embedType: "image/jpeg" });
    opts?.onProgress?.(1);
    return { blob, filename: pdfFilename(input.name) };
  },
};

export default heicToPdf;
