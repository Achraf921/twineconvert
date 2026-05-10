/**
 * Pure-JS BMP encoder. Necessary because Canvas.toBlob does not support
 * "image/bmp" in any major browser; asking Chromium for image/bmp
 * silently falls back to image/png. So we decode to ImageData via
 * Canvas, then write the BMP byte stream ourselves.
 *
 * Output: BITMAPV3INFOHEADER, 32 bits-per-pixel BGRA, no compression.
 * That format is universally readable by Windows, macOS Preview, GIMP,
 * Photoshop, and the BMP loaders in libbmp/Pillow/etc.
 */

export async function encodeBmpFromImage(input: File | Blob): Promise<Blob> {
  const url = URL.createObjectURL(input);
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

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return encodeBmp32(imageData);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Encode a 32 bpp BMP from canvas ImageData (RGBA pixel order). */
export function encodeBmp32(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowSize = width * 4; // 32 bpp, no padding needed (4-byte aligned)
  const pixelDataSize = rowSize * height;

  // BITMAPFILEHEADER (14 bytes) + BITMAPINFOHEADER (40 bytes) = 54 bytes
  const headerSize = 54;
  const fileSize = headerSize + pixelDataSize;

  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  // BITMAPFILEHEADER
  bytes[0] = 0x42; // 'B'
  bytes[1] = 0x4d; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true); // reserved
  view.setUint16(8, 0, true); // reserved
  view.setUint32(10, headerSize, true); // pixel-data offset

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true); // size of this header
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true); // negative => top-down rows (avoid flipping)
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 32, true); // bpp
  view.setUint32(30, 0, true); // compression: BI_RGB
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 2835, true); // pixels-per-meter X (~72 DPI)
  view.setInt32(42, 2835, true); // pixels-per-meter Y
  view.setUint32(46, 0, true); // colors used
  view.setUint32(50, 0, true); // important colors

  // Pixel data: BGRA order (canvas gives RGBA)
  let p = headerSize;
  for (let i = 0; i < data.length; i += 4) {
    bytes[p++] = data[i + 2]; // B
    bytes[p++] = data[i + 1]; // G
    bytes[p++] = data[i]; // R
    bytes[p++] = data[i + 3]; // A
  }

  return new Blob([buf], { type: "image/bmp" });
}
