/**
 * Wrap one or more image Blobs into a single PDF using pdf-lib.
 * Each image becomes one page sized to the image's intrinsic dimensions
 * (no scaling / fitting — most "image to PDF" tools work this way).
 */

import { swapExtension } from "./canvas-encode";

export interface ImageToPdfOptions {
  /** "image/jpeg" or "image/png" — pdf-lib supports these natively. */
  embedType: "image/jpeg" | "image/png";
}

export async function imagesToPdf(
  images: Array<Blob | File>,
  opts: ImageToPdfOptions,
): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");

  const doc = await PDFDocument.create();

  for (const image of images) {
    const bytes = new Uint8Array(await image.arrayBuffer());
    const embedded =
      opts.embedType === "image/jpeg"
        ? await doc.embedJpg(bytes)
        : await doc.embedPng(bytes);
    const page = doc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }

  const pdfBytes = await doc.save();
  // Convert to Blob via Uint8Array.buffer slice for type safety
  const buf = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer;
  return new Blob([buf], { type: "application/pdf" });
}

/** Build a PDF filename from the input filename. */
export function pdfFilename(originalName: string): string {
  return swapExtension(originalName, "pdf");
}
