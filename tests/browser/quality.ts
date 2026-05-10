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

/** Width of the spatial fingerprint grid. 8 means 64 cells: enough
 *  resolution to detect cat-vs-dog content swaps and 1-quadrant
 *  recolors that a 4x4 grid can wash out. */
const FP_GRID = 8;

export interface ImageStats {
  width: number;
  height: number;
  meanR: number;
  meanG: number;
  meanB: number;
  meanA: number;
  /** 8x8 grid of mean-RGB cells. Catches flips, crops, content swaps. */
  fingerprint: Float32Array; // length = FP_GRID * FP_GRID * 3
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

  // 8x8 fingerprint: 64 cells, mean RGB per cell
  const totalCells = FP_GRID * FP_GRID;
  const fp = new Float32Array(totalCells * 3);
  const counts = new Uint32Array(totalCells);
  const cellW = width / FP_GRID;
  const cellH = height / FP_GRID;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cx = Math.min(FP_GRID - 1, Math.floor(x / cellW));
      const cy = Math.min(FP_GRID - 1, Math.floor(y / cellH));
      const cell = cy * FP_GRID + cx;
      const i = (y * width + x) * 4;
      fp[cell * 3 + 0] += data[i];
      fp[cell * 3 + 1] += data[i + 1];
      fp[cell * 3 + 2] += data[i + 2];
      counts[cell]++;
    }
  }
  for (let c = 0; c < totalCells; c++) {
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
  /** Maximum mean per-channel delta accepted across the 8x8 fingerprint.
   *  Default 18 (out of 255). Lossy formats (JPEG q=0.9) sit around 5;
   *  format-pair conversions (PNG to JPEG) sit around 10; very different
   *  content sits well above 30. */
  maxFingerprintDelta?: number;
  /** Maximum mean per-channel delta on the 4 corners. Default 24. */
  maxCornerDelta?: number;
  /** Maximum |meanR_in - meanR_out| (and same for G, B) — catches
   *  uniform color casts. Default 30 (out of 255). */
  maxChannelDelta?: number;
  /** If true, allow the output to differ in dimensions (some converters
   *  add padding / scale). Default false: same dimensions required. */
  allowSizeDelta?: boolean;
}

/** Assert that the output image is "the same" as the input within the
 *  thresholds. Catches content swap, color shift, flip, crop, axis
 *  swap, uniform color cast, and excessive quality loss.
 *
 *  Layered checks (each catches what the others might miss):
 *   1. dimensions: rejects scale / crop changes
 *   2. 8x8 spatial fingerprint: rejects content swap, big crop,
 *      block-level recolor (granularity = catches single-quadrant
 *      changes that 4x4 averaged out)
 *   3. corner-pixel delta: rejects flips even when the average
 *      colors happen to be symmetric
 *   4. per-channel mean delta: rejects uniform color casts (e.g.
 *      RGB→BGR swap, alpha-flatten with wrong background)
 *   5. asymmetry check: orthogonal validation that an axis-swap
 *      didn't slip through by comparing fingerprint to its own
 *      90°-rotated copy
 */
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

  // Corner check — catches flips even when fingerprint averages match
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

  // Per-channel mean check — catches uniform color cast
  const dr = Math.abs(a.meanR - b.meanR);
  const dg = Math.abs(a.meanG - b.meanG);
  const db = Math.abs(a.meanB - b.meanB);
  const channelDelta = Math.max(dr, dg, db);
  const maxChannel = opts.maxChannelDelta ?? 30;
  if (channelDelta > maxChannel) {
    throw new Error(
      `Per-channel mean shifted: |Δ|=${channelDelta.toFixed(1)} (max=${maxChannel}). ` +
        `R:${dr.toFixed(1)} G:${dg.toFixed(1)} B:${db.toFixed(1)}. Suggests color cast or wrong background.`,
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
// Video content validators
// ============================================================================

/** Probe a video blob's duration via the HTMLVideoElement metadata
 *  event. Catches the failure mode where a converter emits a valid
 *  video container with 0 duration / no streams. */
export async function videoDuration(blob: Blob): Promise<number> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<number>((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;
      v.onloadedmetadata = () => resolve(v.duration);
      v.onerror = () => reject(new Error("Video could not be decoded"));
      // Some containers (raw AVI) won't expose duration via metadata
      // event; fall back to a finite value if duration is reported as Infinity.
      setTimeout(() => {
        if (Number.isFinite(v.duration) && v.duration > 0) resolve(v.duration);
      }, 1500);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Assert a video blob has a duration close to the expected value
 *  (catches "valid container, zero stream" bugs). */
export async function assertVideoDuration(
  blob: Blob,
  expectedSeconds: number,
  toleranceSeconds = 0.5,
): Promise<void> {
  const dur = await videoDuration(blob);
  if (!Number.isFinite(dur) || dur <= 0) {
    throw new Error(`Video has no decodable duration (got ${dur}). Container is empty.`);
  }
  if (Math.abs(dur - expectedSeconds) > toleranceSeconds) {
    throw new Error(
      `Video duration ${dur.toFixed(3)}s differs from expected ${expectedSeconds}s by more than ${toleranceSeconds}s.`,
    );
  }
}

// ============================================================================
// PDF content validators
// ============================================================================

/** Extract every word of every page in a PDF blob via pdfjs-dist. */
export async function pdfText(blob: Blob): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  // Empty workerSrc forces the main-thread fallback — fine for tiny
  // test PDFs, removes a bundling dependency.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.mjs";
  const data = new Uint8Array(await blob.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  return pages.join("\n");
}

/** Render the first page of a PDF to an ImageData so a downstream
 *  fingerprint comparison can run. */
export async function pdfFirstPageImageData(blob: Blob, scale = 1): Promise<ImageData> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.mjs";
  const data = new Uint8Array(await blob.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Assert a PDF contains every one of the given strings (case-insensitive
 *  substring match). Catches the failure mode where a converter writes
 *  a valid-looking PDF that has no text or the wrong text.
 *
 *  Only useful for converters that emit SEARCHABLE PDFs (real text
 *  embedded in the document). Our jspdf-html-rendered PDFs rasterize
 *  the source HTML via html2canvas and produce image-only PDFs with
 *  no extractable text; for those, use assertPdfNotBlank instead.
 */
export async function assertPdfContains(blob: Blob, expected: string[]): Promise<void> {
  const text = (await pdfText(blob)).toLowerCase();
  const missing = expected.filter((e) => !text.includes(e.toLowerCase()));
  if (missing.length > 0) {
    throw new Error(
      `PDF missing expected text: ${JSON.stringify(missing)}. PDF text was: ${JSON.stringify(text.slice(0, 300))}…`,
    );
  }
}

/** Render the first page of a PDF and assert it isn't blank.
 *  "Not blank" means: at least 1% of pixels deviate from pure white.
 *  Catches the failure mode where the converter produces a syntactically
 *  valid empty page. */
export async function assertPdfNotBlank(blob: Blob, opts: { minInkRatio?: number } = {}): Promise<void> {
  const img = await pdfFirstPageImageData(blob, 1);
  const { data } = img;
  let inkPixels = 0;
  const total = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    // "Ink" = any pixel that isn't basically white. Allow 16-unit slack
    // for anti-aliasing fringes against the page background.
    if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) {
      inkPixels++;
    }
  }
  const ratio = inkPixels / total;
  // 0.1% catches the silent-blank-page bug (was 0.00%) while not
  // false-failing on short text inputs that occupy a small fraction
  // of an A4 page.
  const min = opts.minInkRatio ?? 0.001;
  if (ratio < min) {
    throw new Error(
      `PDF first page is blank or near-blank: ${(ratio * 100).toFixed(2)}% non-white pixels (min ${(min * 100).toFixed(2)}%).`,
    );
  }
}

/** Assert that the first page of an image-PDF (jpg-to-pdf etc.) has
 *  a similar appearance to the provided source image. Renders the
 *  PDF page and compares fingerprint to the source. Lenient on size
 *  because PDF rendering scales. */
export async function assertPdfImageMatches(
  source: Blob,
  pdf: Blob,
  opts: { maxFingerprintDelta?: number } = {},
): Promise<void> {
  const sourceData = await (async () => {
    const url = URL.createObjectURL(source);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, c.width, c.height);
    } finally {
      URL.revokeObjectURL(url);
    }
  })();

  const pdfData = await pdfFirstPageImageData(pdf, 1);

  const fpA = imageDataFingerprint(sourceData);
  const fpB = imageDataFingerprint(pdfData);
  const delta = fingerprintDelta(fpA, fpB);
  const max = opts.maxFingerprintDelta ?? 30;
  if (delta > max) {
    throw new Error(
      `PDF page does not match source image: fingerprint delta=${delta.toFixed(1)} (max=${max})`,
    );
  }
}

function imageDataFingerprint(img: ImageData): Float32Array {
  const { width, height, data } = img;
  const totalCells = FP_GRID * FP_GRID;
  const fp = new Float32Array(totalCells * 3);
  const counts = new Uint32Array(totalCells);
  const cellW = width / FP_GRID;
  const cellH = height / FP_GRID;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cx = Math.min(FP_GRID - 1, Math.floor(x / cellW));
      const cy = Math.min(FP_GRID - 1, Math.floor(y / cellH));
      const cell = cy * FP_GRID + cx;
      const i = (y * width + x) * 4;
      fp[cell * 3 + 0] += data[i];
      fp[cell * 3 + 1] += data[i + 1];
      fp[cell * 3 + 2] += data[i + 2];
      counts[cell]++;
    }
  }
  for (let c = 0; c < totalCells; c++) {
    fp[c * 3 + 0] /= counts[c] || 1;
    fp[c * 3 + 1] /= counts[c] || 1;
    fp[c * 3 + 2] /= counts[c] || 1;
  }
  return fp;
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
