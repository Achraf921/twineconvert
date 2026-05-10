import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractIworkPreview } from "../util/iwork-extract";

const keynoteToPdf: Converter = {
  id: "keynote-to-pdf",
  label: "Apple Keynote → PDF",
  fromMime: ["application/vnd.apple.keynote", "application/zip"],
  accept: [".key", ".keynote"],
  toMime: "application/pdf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.2);
    let blob: Blob;
    try {
      blob = await extractIworkPreview(input);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not extract PDF from Keynote document",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

export default keynoteToPdf;
