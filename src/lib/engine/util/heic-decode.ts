/**
 * Decode a HEIC/HEIF file into a re-encoded Blob of the requested format.
 * Uses heic2any (lazy-loaded). The library handles libheif under the hood
 * and produces a JPEG / PNG / WebP Blob directly — no Canvas re-encode
 * needed when the target format is one heic2any supports natively.
 */
export async function decodeHeic(
  input: File | Blob,
  toMime: "image/jpeg" | "image/png" | "image/webp",
  quality?: number,
): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: input,
    toType: toMime,
    quality,
  });
  // heic2any returns Blob | Blob[] for multi-image HEIC containers
  // (Live Photos, burst captures). We pick the primary frame; tools
  // that target multi-image extraction will use a different code path.
  return Array.isArray(result) ? result[0] : result;
}
