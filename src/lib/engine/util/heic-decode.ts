/**
 * Decode a HEIC/HEIF file into a re-encoded Blob of the requested format.
 * Uses heic2any (lazy-loaded). The library natively supports image/jpeg,
 * image/png, and image/gif; for image/webp we get a PNG and re-encode
 * via Canvas.
 *
 * (heic2any silently falls back to PNG when given an unsupported toType,
 * which is the bug that previously made heic-to-webp return PNG bytes
 * with a .webp filename.)
 */
export async function decodeHeic(
  input: File | Blob,
  toMime: "image/jpeg" | "image/png" | "image/webp",
  quality?: number,
): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const useNative = toMime === "image/jpeg" || toMime === "image/png";
  const result = await heic2any({
    blob: input,
    toType: useNative ? toMime : "image/png",
    quality: useNative ? quality : 1,
  });
  // heic2any returns Blob | Blob[] for multi-image HEIC containers
  // (Live Photos, burst captures). We pick the primary frame.
  const primary = Array.isArray(result) ? result[0] : result;
  if (useNative) return primary;

  // image/webp: re-encode the PNG via Canvas
  const { canvasEncode } = await import("./canvas-encode");
  return canvasEncode(primary, { toMime, quality });
}
