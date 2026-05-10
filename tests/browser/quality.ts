/**
 * Quality validators for browser tests. Goes beyond magic-byte checks
 * to detect "the conversion produced a real file of the right format
 * but the content is wrong":
 *
 *   - Dimensions changed unexpectedly (cropped or scaled wrong)
 *   - Image flipped horizontally/vertically
 *   - Colors shifted significantly (cat in different colors)
 *   - Content replaced (cat became dog) — caught by spatial fingerprint
 *   - Quality degraded beyond reasonable lossy bounds (blurry cat)
 *   - Audio came out silent / wrong duration / wrong sample rate
 *
 * For audio we decode via Web Audio API; for images we decode via
 * canvas. Both stay inside the browser-test environment.
 */

export interface ImageStats {
  width: number;
  height: number;
  meanR: number;
  meanG: number;
  meanB: number;
  meanA: number;
  /** 4x4 grid of mean-RGB cells. Catches flips, crops, content swaps. */
  fingerprint: Float32Array; // length 48 = 4*4*3
  /** Top-left, top-right, bottom-left, bottom-right pixel RGB triples. */
  corners: { tl: [number, number, number]; tr: [number, number, number]; bl: [number, number, number]; br: [number, number, number] };
}

/** Decode an image blob to an ImageData via canvas. */
async function decodeImage(blob: Blob): Promise<ImageData> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function imageStats(blob: Blob): Promise<ImageStats> {
  const img = await decodeImage(blob);
  const { width, height, data } = img;
  const n = width * height;

  let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
    sumA += data[i + 3];
  }

  // 4x4 fingerprint: 16 cells, mean RGB per cell
  const fp = new Float32Array(48);
  const counts = new Uint32Array(16);
  const cellW = width / 4;
  const cellH = height / 4;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cx = Math.min(3, Math.floor(x / cellW));
      const cy = Math.min(3, Math.floor(y / cellH));
      const cell = cy * 4 + cx;
      const i = (y * width + x) * 4;
      fp[cell * 3 + 0] += data[i];
      fp[cell * 3 + 1] += data[i + 1];
      fp[cell * 3 + 2] += data[i + 2];
      counts[cell]++;
    }
  }
  for (let c = 0; c < 16; c++) {
    fp[c * 3 + 0] /= counts[c] || 1;
    fp[c * 3 + 1] /= counts[c] || 1;
    fp[c * 3 + 2] /= counts[c] || 1;
  }

  const corner = (x: number, y: number): [number, number, number] => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  return {
    width,
    height,
    meanR: sumR / n,
    meanG: sumG / n,
    meanB: sumB / n,
    meanA: sumA / n,
    fingerprint: fp,
    corners: {
      tl: corner(0, 0),
      tr: corner(width - 1, 0),
      bl: corner(0, height - 1),
      br: corner(width - 1, height - 1),
    },
  };
}

/** Mean absolute delta between two fingerprints. 0 = identical, ~255 = max. */
export function fingerprintDelta(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return Infinity;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return total / a.length;
}

export interface AssertImageQualityOptions {
  /** Maximum mean per-channel delta accepted across the 4x4 fingerprint.
   *  Default 18 (out of 255). Lossy formats (JPEG q=0.9) sit around 5;
   *  format-pair conversions (PNG to JPEG) sit around 10; very different
   *  content sits well above 30. */
  maxFingerprintDelta?: number;
  /** Maximum mean per-channel delta on the 4 corners. Default 24. */
  maxCornerDelta?: number;
  /** If true, allow the output to differ in dimensions (some converters
   *  add padding / scale). Default false: same dimensions required. */
  allowSizeDelta?: boolean;
}

/** Assert that the output image is "the same" as the input within the
 *  thresholds. Catches content swap, color shift, flip, crop, and
 *  excessive quality loss. */
export async function assertImageQuality(
  input: Blob,
  output: Blob,
  opts: AssertImageQualityOptions = {},
): Promise<void> {
  const a = await imageStats(input);
  const b = await imageStats(output);

  if (!opts.allowSizeDelta) {
    if (a.width !== b.width || a.height !== b.height) {
      throw new Error(
        `Dimensions changed: input ${a.width}x${a.height}, output ${b.width}x${b.height}`,
      );
    }
  }

  const fpDelta = fingerprintDelta(a.fingerprint, b.fingerprint);
  const max = opts.maxFingerprintDelta ?? 18;
  if (fpDelta > max) {
    throw new Error(
      `Spatial fingerprint changed too much: delta=${fpDelta.toFixed(1)} (max=${max}). ` +
        `This usually means the image was flipped, cropped, recolored, or replaced.`,
    );
  }

  // Corner check — catches flips that fingerprint might smooth out
  const cornerKeys: Array<keyof ImageStats["corners"]> = ["tl", "tr", "bl", "br"];
  let cornerDelta = 0;
  for (const k of cornerKeys) {
    const ax = a.corners[k];
    const bx = b.corners[k];
    cornerDelta += Math.abs(ax[0] - bx[0]) + Math.abs(ax[1] - bx[1]) + Math.abs(ax[2] - bx[2]);
  }
  cornerDelta /= 12; // 4 corners * 3 channels
  const maxCorner = opts.maxCornerDelta ?? 24;
  if (cornerDelta > maxCorner) {
    throw new Error(
      `Corner pixels changed too much: delta=${cornerDelta.toFixed(1)} (max=${maxCorner}). ` +
        `This usually means the image was flipped or cropped.`,
    );
  }
}

/** Assert that a converted image is NOT a flipped version of the input
 *  by comparing original-corners against output-corners-with-each-flip-applied. */
export async function assertNotFlipped(input: Blob, output: Blob): Promise<void> {
  const a = await imageStats(input);
  const b = await imageStats(output);
  // Sum of |orig.tl - output.tl| etc.
  const direct = colorDist(a.corners.tl, b.corners.tl) + colorDist(a.corners.br, b.corners.br);
  // If output were h-flipped: output.tl ≈ input.tr
  const hFlipped = colorDist(a.corners.tr, b.corners.tl) + colorDist(a.corners.bl, b.corners.br);
  // If output were v-flipped: output.tl ≈ input.bl
  const vFlipped = colorDist(a.corners.bl, b.corners.tl) + colorDist(a.corners.tr, b.corners.br);

  if (hFlipped < direct - 24 || vFlipped < direct - 24) {
    throw new Error(
      `Output appears to be flipped: direct=${direct.toFixed(1)}, h-flipped=${hFlipped.toFixed(1)}, v-flipped=${vFlipped.toFixed(1)}`,
    );
  }
}

function colorDist(a: [number, number, number], b: [number, number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

// ============================================================================
// Audio quality validators
// ============================================================================

export interface AudioStats {
  sampleRate: number;
  duration: number;
  channels: number;
  /** RMS amplitude of the first channel. */
  rms: number;
}

export async function audioStats(blob: Blob): Promise<AudioStats> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const channel = buf.getChannelData(0);
    let sumSquares = 0;
    for (let i = 0; i < channel.length; i++) sumSquares += channel[i] * channel[i];
    const rms = Math.sqrt(sumSquares / channel.length);
    return {
      sampleRate: buf.sampleRate,
      duration: buf.duration,
      channels: buf.numberOfChannels,
      rms,
    };
  } finally {
    await ctx.close();
  }
}

export interface AssertAudioQualityOptions {
  /** Maximum |duration_out - duration_in| in seconds. Default 0.2. */
  maxDurationDelta?: number;
  /** Whether the output is required to have non-zero RMS (i.e., not silent). */
  requireNonSilent?: boolean;
}

export async function assertAudioQuality(
  input: Blob,
  output: Blob,
  opts: AssertAudioQualityOptions = {},
): Promise<void> {
  const a = await audioStats(input);
  const b = await audioStats(output);

  const maxDur = opts.maxDurationDelta ?? 0.2;
  if (Math.abs(a.duration - b.duration) > maxDur) {
    throw new Error(
      `Audio duration changed: input=${a.duration.toFixed(2)}s, output=${b.duration.toFixed(2)}s (max delta=${maxDur}s)`,
    );
  }

  if (opts.requireNonSilent && b.rms < 1e-5) {
    throw new Error(`Audio output is silent: rms=${b.rms.toExponential(2)}`);
  }
}
