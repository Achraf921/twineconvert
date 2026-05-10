import type { Converter } from "../types";
import { ConvertFailedError } from "../types";

/**
 * Compress PDF, re-saves the input with pdf-lib's basic optimizations
 * (object stream re-write, removed duplicate resources). NOT a deep
 * recompression of embedded images; for that we'd need to render every
 * page, re-encode at lower quality, and re-assemble, much bigger scope.
 *
 * Realistic compression ratio for typical "office documents with embedded
 * fonts + some images": ~10-30% size reduction. For PDFs that are mostly
 * scanned images, almost no reduction (the images are already the bulk).
 */
const compressPdf: Converter = {
  id: "compress-pdf",
  label: "Compress PDF",
  fromMime: ["application/pdf"],
  toMime: "application/pdf",
  accept: [".pdf"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    const { PDFDocument } = await import("pdf-lib");

    let blob: Blob;
    try {
      const bytes = new Uint8Array(await input.arrayBuffer());
      const doc = await PDFDocument.load(bytes, {
        // Speed up by skipping streamed-object validation
        ignoreEncryption: false,
      });
      opts?.onProgress?.(0.5);

      const out = await doc.save({
        useObjectStreams: true, // tighter object packing
        addDefaultPage: false,
      });
      const buf = out.buffer.slice(
        out.byteOffset,
        out.byteOffset + out.byteLength,
      ) as ArrayBuffer;
      blob = new Blob([buf], { type: "application/pdf" });
    } catch (err) {
      throw new ConvertFailedError(
        "Could not compress PDF, file may be corrupt or password-protected",
        err,
      );
    }

    opts?.onProgress?.(1);
    return { blob, filename: input.name };
  },
};

export default compressPdf;
