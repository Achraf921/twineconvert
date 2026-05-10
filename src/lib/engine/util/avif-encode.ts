/**
 * Encode a raw image to AVIF using @jsquash/avif (WASM port of libavif).
 *
 * Browser-native AVIF DECODE is widely supported; ENCODE is not (Canvas
 * can't toBlob('image/avif') reliably). For the encoding side we ship our
 * own WASM encoder, lazy-loaded.
 */

export interface AvifEncodeOptions {
  /** 0..100 quality. ~70-80 is typical "visually lossless" range. */
  quality?: number;
  /**
   * libavif speed: 0 = slowest/best compression, 10 = fastest/worst.
   * Default 6, balanced for an in-browser experience (slower than 8 but
   * meaningfully smaller output).
   */
  speed?: number;
}

/**
 * Decode any browser-supported image to ImageData via Canvas, then
 * re-encode to AVIF.
 */
export async function encodeAvif(
  input: File | Blob,
  opts: AvifEncodeOptions = {},
): Promise<Blob> {
  // Step 1: decode source to ImageData (the format jsquash needs)
  const url = URL.createObjectURL(input);
  let imageData: ImageData;
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

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

  // Step 2: lazy-load jsquash AVIF encoder + encode
  const { encode } = await import("@jsquash/avif");
  const avifBuffer = await encode(imageData, {
    quality: opts.quality ?? 75,
    speed: opts.speed ?? 6,
  });

  return new Blob([avifBuffer], { type: "image/avif" });
}
