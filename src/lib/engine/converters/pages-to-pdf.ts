import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractIworkPreview } from "../util/iwork-extract";

const pagesToPdf: Converter = {
  id: "pages-to-pdf",
  label: "Apple Pages → PDF",
  fromMime: ["application/vnd.apple.pages", "application/zip"],
  accept: [".pages"],
  toMime: "application/pdf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.2);
    let blob: Blob;
    try {
      blob = await extractIworkPreview(input);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not extract PDF from Pages document",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

export default pagesToPdf;
