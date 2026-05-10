/**
 * Decode a TIFF file to ImageData. Browsers don't natively decode TIFF,
 * so we use utif (small pure-JS port).
 *
 * Multi-page TIFFs return only the FIRST page. Multi-page extraction is
 * a separate feature for the "TIFF → ZIP of pages" tool family later.
 */

export interface TiffDecoded {
  imageData: ImageData;
  width: number;
  height: number;
}

export async function decodeTiff(input: File | Blob): Promise<TiffDecoded> {
  const UTIF = (await import("utif")).default;

  const buffer = await input.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  if (!ifds.length) throw new Error("TIFF has no decodable pages");

  const ifd = ifds[0];
  UTIF.decodeImage(buffer, ifd);
  const rgba = UTIF.toRGBA8(ifd); // Uint8Array, 4 bytes/pixel

  const width = ifd.width;
  const height = ifd.height;

  // Copy into a fresh Uint8ClampedArray so the underlying buffer is a
  // plain ArrayBuffer (ImageData rejects SharedArrayBuffer-backed views).
  const clamped = new Uint8ClampedArray(rgba.length);
  clamped.set(rgba);
  const imageData = new ImageData(clamped, width, height);

  return { imageData, width, height };
}

/** Render decoded TIFF ImageData onto a Canvas for further encoding. */
export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
