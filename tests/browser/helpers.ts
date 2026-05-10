/**
 * Browser-test helpers. These run inside Chromium via Vitest browser mode,
 * so they have access to Canvas, Image decoding, FFmpeg.wasm Workers, real
 * File/Blob, etc.
 */

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

/** Fetch a committed binary fixture. Vitest browser mode serves the project
 *  root as static, so /tests/browser/fixtures/<name> is reachable. */
export async function loadFixture(name: string): Promise<File> {
  const url = `/tests/browser/fixtures/${name}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Fixture fetch failed: ${url} (${resp.status})`);
  const blob = await resp.blob();
  return new File([blob], name, { type: blob.type || "application/octet-stream" });
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
