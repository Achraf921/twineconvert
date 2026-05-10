/**
 * Single-frame GIF encoder using gifenc. Necessary because Canvas.toBlob
 * does not support image/gif (asking Chromium for image/gif silently
 * falls back to image/png, mirroring the BMP situation).
 *
 * Strategy: decode the input via Canvas (any format the browser knows),
 * read the ImageData, quantize to a 256-colour palette, and encode a
 * single-frame GIF89a via gifenc. Suitable for the static jpg-to-gif
 * and png-to-gif routes; animated GIF generation (mp4-to-gif) lives
 * elsewhere on FFmpeg.
 */

export async function encodeGifFromImage(input: File | Blob): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");

  const url = URL.createObjectURL(input);
  let imageData: ImageData;
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      throw new Error("Decoded image has zero dimensions");
    }
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(img, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }

  // Build a 256-colour palette and apply it
  const palette = quantize(imageData.data, 256);
  const indexed = applyPalette(imageData.data, palette);

  const gif = GIFEncoder();
  gif.writeFrame(indexed, imageData.width, imageData.height, { palette });
  gif.finish();

  // Copy into a fresh ArrayBuffer-backed Uint8Array so the Blob constructor's
  // BlobPart type narrows (gifenc returns Uint8Array<ArrayBufferLike>).
  return new Blob([new Uint8Array(gif.bytes())], { type: "image/gif" });
}
