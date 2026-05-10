import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractIworkPreview } from "../util/iwork-extract";

const numbersToPdf: Converter = {
  id: "numbers-to-pdf",
  label: "Apple Numbers → PDF",
  fromMime: ["application/vnd.apple.numbers", "application/zip"],
  accept: [".numbers"],
  toMime: "application/pdf",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.2);
    let blob: Blob;
    try {
      blob = await extractIworkPreview(input);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not extract PDF from Numbers document",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

export default numbersToPdf;
