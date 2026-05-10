/**
 * Decode any browser-supported image format → re-encode to any browser-
 * supported format via Canvas. Used by the dozens of "image format pair"
 * converters that don't need a specialized decoder.
 *
 * What works as input (varies by browser, but a safe modern baseline):
 *   image/jpeg, image/png, image/webp, image/gif, image/bmp, image/avif,
 *   image/svg+xml
 *
 * What works as output (Canvas.toBlob support):
 *   image/jpeg, image/png, image/webp
 *   (image/avif emerging but inconsistent; we use specialized libs for AVIF)
 *
 * For animated formats (GIF, animated WebP), this returns the FIRST FRAME
 * only — animated→still conversion is the realistic browser-side use case.
 * Animated→animated needs FFmpeg.wasm and lives in a different family.
 */

export interface CanvasEncodeOptions {
  /** Target output MIME, e.g. "image/jpeg" */
  toMime: string;

  /** 0..1 quality for lossy outputs. Ignored for lossless (image/png). */
  quality?: number;

  /** Background color when decoding a transparent format → opaque format. */
  background?: string;
}

export async function canvasEncode(
  input: File | Blob,
  opts: CanvasEncodeOptions,
): Promise<Blob> {
  const url = URL.createObjectURL(input);
  try {
    const img = new Image();
    // CORS not relevant here — blob URLs are same-origin.
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

    // For lossy opaque formats (jpeg) flatten transparency onto a background.
    if (opts.toMime === "image/jpeg" && opts.background) {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error(`Canvas could not encode ${opts.toMime}`));
        },
        opts.toMime,
        opts.quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Replace the input filename's extension with a new one.
 * Preserves the basename. Falls back to appending if no extension found.
 */
export function swapExtension(filename: string, newExt: string): string {
  const ext = newExt.startsWith(".") ? newExt : `.${newExt}`;
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return filename + ext;
  return filename.slice(0, dot) + ext;
}
