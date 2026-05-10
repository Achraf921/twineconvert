/**
 * Browser-test helpers. These run inside Chromium via Vitest browser mode,
 * so they have access to Canvas, Image decoding, FFmpeg.wasm Workers, real
 * File/Blob, etc.
 */

// Base64-encoded fixtures (regenerate with scripts/encode-fixtures.js if changed)
const TINY_TIFF_BASE64 = "SUkqAAgAAAAIAAABAwABAAAACAAAAAEBAwABAAAACAAAAAIBAwABAAAACAAAAAMBAwABAAAAAQAAAAYBAwABAAAAAQAAABEBBAABAAAAbgAAABYBAwABAAAACAAAABcBBAABAAAAQAAAAAAAAAAAECAwQFBgcBAgMEBQYHCAIDBAUGBwgJAwQFBgcICQoEBQYHCAkKCwUGBwgJCgsMBgcICQoLDA0HCAkKCwwNDg";
const TINY_AVIF_BASE64 = "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";

/** Generate a tiny solid-color PNG using Canvas. Always succeeds; no fixture
 *  to commit. Useful as input for any image converter that expects PNG. */
export async function makePngBlob(
  width = 8,
  height = 8,
  fill = "#E0297B",
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context unavailable");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

/** Same idea, but JPEG. */
export async function makeJpegBlob(
  width = 8,
  height = 8,
  fill = "#E0297B",
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context unavailable");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9);
  });
}

/** WebP via canvas (Chromium supports canvas.toBlob for image/webp). */
export async function makeWebpBlob(
  width = 8,
  height = 8,
  fill = "#E0297B",
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context unavailable");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/webp", 0.9);
  });
}

/** Wrap a Blob as a File with a name + type, ready for the runner. */
export function fileFromBlob(blob: Blob, name: string, type?: string): File {
  return new File([blob], name, { type: type ?? blob.type });
}

/** Decode a base64 string to a File. Used for inlined small fixtures
 *  (TIFF, AVIF) that we ship in tests/browser/fixtures/inline-fixtures.ts. */
export function fileFromBase64(b64: string, name: string, mime: string): File {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

/** Load one of the named binary fixtures we ship inline. Larger fixtures
 *  (HEIC, real MP4) are not yet inlinable; tests for those are gated
 *  behind a runtime check that skips when the inline payload is missing. */
export function loadFixtureSync(name: string): File {
  switch (name) {
    case "sample.tif":
      return fileFromBase64(TINY_TIFF_BASE64, "sample.tif", "image/tiff");
    case "sample.avif":
      return fileFromBase64(TINY_AVIF_BASE64, "sample.avif", "image/avif");
    default:
      throw new Error(`Unknown inline fixture: ${name}`);
  }
}

/** Assert a Blob's first N bytes match an expected magic-byte sequence. */
export async function expectMagic(blob: Blob, expected: number[]): Promise<void> {
  const head = new Uint8Array(await blob.slice(0, expected.length).arrayBuffer());
  for (let i = 0; i < expected.length; i++) {
    if (head[i] !== expected[i]) {
      throw new Error(
        `Magic byte mismatch at offset ${i}: expected 0x${expected[i].toString(16)}, got 0x${head[i].toString(16)}`,
      );
    }
  }
}

/** Common magic-byte signatures. */
export const MAGIC = {
  PNG: [0x89, 0x50, 0x4e, 0x47],
  JPEG: [0xff, 0xd8, 0xff],
  GIF: [0x47, 0x49, 0x46, 0x38],
  BMP: [0x42, 0x4d],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // RIFF (then WEBP at offset 8)
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  ZIP: [0x50, 0x4b, 0x03, 0x04],
  ICO: [0x00, 0x00, 0x01, 0x00],
  AVIF_FTYP: [0x66, 0x74, 0x79, 0x70], // 'ftyp' at offset 4
  TIFF_LE: [0x49, 0x49, 0x2a, 0x00],
  TIFF_BE: [0x4d, 0x4d, 0x00, 0x2a],
};
