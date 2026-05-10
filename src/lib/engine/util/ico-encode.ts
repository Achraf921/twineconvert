/**
 * ICO encoder. Browsers can DECODE .ico via <img>, but no `toBlob('image/x-icon')`
 * exists — we have to write the container ourselves.
 *
 * ICO file structure (little-endian):
 *   ICONDIR header (6 bytes):
 *     0-1: reserved (0)
 *     2-3: type (1 = icon)
 *     4-5: image count
 *   For each image, ICONDIRENTRY (16 bytes):
 *     0:    width (0 = 256)
 *     1:    height (0 = 256)
 *     2:    color count (0 if >= 256 colors)
 *     3:    reserved (0)
 *     4-5:  color planes (1)
 *     6-7:  bits per pixel (32)
 *     8-11: image data size in bytes
 *     12-15: offset to image data
 *   Then concatenated image payloads — for our purposes, embedded PNG
 *   data (Microsoft added PNG-in-ICO support back in Vista; every modern
 *   browser/OS reads it).
 *
 * Using PNG payloads (not the legacy BMP+mask format) means we can hand
 * the canvas's PNG output directly to the encoder — no per-pixel work.
 */

export interface IcoSize {
  size: number; // 16, 32, 48, 64, 128, 256
}

const STANDARD_FAVICON_SIZES = [16, 32, 48, 64, 128, 256];

/**
 * Encode a source image into an ICO containing multiple sizes scaled
 * from the source. We default to the standard favicon size set; callers
 * can override if they want a single-size icon.
 */
export async function encodeIco(
  source: File | Blob,
  sizes: number[] = STANDARD_FAVICON_SIZES,
): Promise<Blob> {
  const url = URL.createObjectURL(source);
  let img: HTMLImageElement;
  try {
    img = new Image();
    img.src = url;
    await img.decode();
  } finally {
    URL.revokeObjectURL(url);
  }

  // Generate one PNG payload per requested size.
  const payloads: { size: number; png: Uint8Array }[] = [];
  for (const size of sizes) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(img, 0, 0, size, size);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png");
    });
    payloads.push({ size, png: new Uint8Array(await png.arrayBuffer()) });
  }

  // Build the ICONDIR + ICONDIRENTRY table + concatenated payloads.
  const headerSize = 6 + 16 * payloads.length;
  const totalSize = headerSize + payloads.reduce((s, p) => s + p.png.length, 0);
  const out = new Uint8Array(totalSize);
  const dv = new DataView(out.buffer);
  dv.setUint16(0, 0, true);  // reserved
  dv.setUint16(2, 1, true);  // type = icon
  dv.setUint16(4, payloads.length, true);

  let imgOffset = headerSize;
  for (let i = 0; i < payloads.length; i++) {
    const p = payloads[i];
    const entryOffset = 6 + 16 * i;
    dv.setUint8(entryOffset + 0, p.size === 256 ? 0 : p.size); // width (0 = 256)
    dv.setUint8(entryOffset + 1, p.size === 256 ? 0 : p.size); // height
    dv.setUint8(entryOffset + 2, 0); // color count
    dv.setUint8(entryOffset + 3, 0); // reserved
    dv.setUint16(entryOffset + 4, 1, true);  // color planes
    dv.setUint16(entryOffset + 6, 32, true); // bits per pixel
    dv.setUint32(entryOffset + 8, p.png.length, true);
    dv.setUint32(entryOffset + 12, imgOffset, true);
    out.set(p.png, imgOffset);
    imgOffset += p.png.length;
  }

  return new Blob([out.buffer as ArrayBuffer], { type: "image/x-icon" });
}
