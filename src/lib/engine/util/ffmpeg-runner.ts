/**
 * Shared FFmpeg.wasm runner used by every audio/video converter.
 *
 * Why single-threaded core (not -mt):
 *   The multi-threaded build is ~2-3x faster but requires SharedArrayBuffer,
 *   which means setting Cross-Origin-Opener-Policy + Cross-Origin-Embedder-Policy
 *   headers. Those headers break embedded ads, third-party scripts, video
 *   embeds, and most analytics scripts, i.e. everything our future
 *   Mediavine/Raptive layer depends on. Single-threaded is slower but
 *   isolation-free, so the site can keep monetizing the SEO surface around
 *   each tool. We can route-segment COOP/COEP later for power-user pages.
 *
 * Why same-origin core (was previously CDN, but switched after the
 * headless Chromium browser tests couldn't reach unpkg cleanly):
 *   The 30MB core ships under public/ffmpeg/, so it's served from the
 *   same origin as the page. Vercel CDN-caches it just like any other
 *   static asset. The 30MB shows up once in the deploy and never again
 *   for repeat visitors.
 */

import type { FFmpeg } from "@ffmpeg/ffmpeg";

const CORE_BASE = "/ffmpeg";

/**
 * The subset of the FFmpeg API the runner touches. Kept as an interface so the
 * instance factory can be swapped for a fake in unit tests (real ffmpeg.wasm
 * only runs in a browser/worker).
 */
export interface FFmpegLike {
  on(event: "progress", handler: (e: { progress: number }) => void): void;
  on(event: "log", handler: (e: { message: string }) => void): void;
  off(event: "progress", handler: (e: { progress: number }) => void): void;
  off(event: "log", handler: (e: { message: string }) => void): void;
  writeFile(name: string, data: Uint8Array): Promise<unknown>;
  exec(args: string[]): Promise<unknown>;
  readFile(name: string): Promise<Uint8Array | string>;
  deleteFile(name: string): Promise<unknown>;
  terminate?(): void;
}

let ffmpegPromise: Promise<FFmpegLike> | null = null;

async function buildFFmpeg(): Promise<FFmpegLike> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");
  const instance = new FFmpeg();

  // toBlobURL fetches the file and rewraps it as a same-origin blob: URL.
  // Required because the worker created by .load() can't fetch
  // cross-origin script URLs in many browsers.
  const [coreURL, wasmURL] = await Promise.all([
    toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
    toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
  ]);

  await instance.load({ coreURL, wasmURL });
  return instance as unknown as FFmpegLike;
}

let instanceFactory: () => Promise<FFmpegLike> = buildFFmpeg;

/** Test seam: swap the instance factory and drop any cached instance. */
export function __setFFmpegFactoryForTest(
  factory: (() => Promise<FFmpegLike>) | null,
): void {
  instanceFactory = factory ?? buildFFmpeg;
  ffmpegPromise = null;
}

async function getFFmpeg(): Promise<FFmpegLike> {
  if (!ffmpegPromise) {
    const loading = instanceFactory();
    ffmpegPromise = loading;
    // A failed LOAD must not poison future conversions either: the old code
    // cached a rejected promise forever, so one flaky 30MB wasm download made
    // every later conversion in the session fail instantly. Clear the cache
    // on rejection so the next job retries the load from scratch.
    loading.catch(() => {
      if (ffmpegPromise === loading) ffmpegPromise = null;
    });
  }
  return ffmpegPromise;
}

/**
 * Discard the cached instance after a failed conversion.
 *
 * ffmpeg.wasm shares one module + one in-memory filesystem across every
 * conversion. A failing exec can `abort()` the underlying wasm module, after
 * which every subsequent call on that instance rejects immediately. Because we
 * cache the instance for the life of the page, one bad file used to poison the
 * whole session: a batch of hundreds of files would fail-fast in seconds, all
 * with the same error and zero successes (observed in production: single
 * sessions with 300-500 ogg-to-mp3 errors and no successes). Dropping the
 * cached instance here means the next queued job rebuilds a clean one, so a
 * single bad file no longer cascades across the batch.
 */
function discardFFmpeg(instance: FFmpegLike): void {
  if (ffmpegPromise) ffmpegPromise = null;
  try {
    instance.terminate?.();
  } catch {
    // Already dead; nothing to clean up.
  }
}

export interface FFmpegConvertOptions {
  /** Args between -i input and the output filename. e.g. ['-vn', '-codec:a', 'libmp3lame', '-q:a', '2'] */
  args: string[];
  /** Filename inside the WASM filesystem for input. Extension matters. */
  inputName: string;
  /** Filename inside the WASM filesystem for output. Extension determines container. */
  outputName: string;
  /** MIME type for the resulting Blob. */
  outputMime: string;
  /** 0..1 progress callback wired to ffmpeg's own progress events. */
  onProgress?: (fraction: number) => void;
}

/**
 * Serialise concurrent FFmpeg invocations.
 *
 * FFmpeg.wasm exposes a single shared instance + a single in-memory
 * filesystem. Two conversions running at the same time would:
 *   1. Race on writeFile (B overwrites A's input mid-flight)
 *   2. Cross-fire progress events (A's onProgress receives B's
 *      progress because the "progress" listener is registered on the
 *      shared instance and fires for any active invocation)
 *
 * We serialise everything through a single promise chain. A typical
 * conversion takes 0.1-2 s for tiny test inputs and up to ~30 s for
 * a long video. Sequential is fine for in-browser use; the user can
 * only initiate one conversion via the Dropzone anyway.
 */
let queue: Promise<unknown> = Promise.resolve();

export async function ffmpegConvert(
  input: File | Blob,
  opts: FFmpegConvertOptions,
): Promise<Blob> {
  const job = queue.then(() => runOne(input, opts));
  // Don't propagate this job's error to the next queued job.
  queue = job.catch(() => undefined);
  return job;
}

async function runOne(input: File | Blob, opts: FFmpegConvertOptions): Promise<Blob> {
  const instance = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");

  const progressHandler = ({ progress }: { progress: number }) => {
    // ffmpeg.wasm reports 0..1 but can over-/underflow; clamp.
    opts.onProgress?.(Math.max(0, Math.min(1, progress)));
  };
  instance.on("progress", progressHandler);

  // Keep a small tail of ffmpeg's own log so failures carry the REAL cause
  // (unsupported codec, corrupt stream, ...) instead of an opaque wrapper.
  const logTail: string[] = [];
  const logHandler = ({ message }: { message: string }) => {
    if (typeof message !== "string" || message.trim() === "") return;
    logTail.push(message.trim());
    if (logTail.length > 12) logTail.shift();
  };
  instance.on("log", logHandler);

  try {
    await instance.writeFile(opts.inputName, await fetchFile(input));
    const exitCode = await instance.exec([
      "-i",
      opts.inputName,
      ...opts.args,
      opts.outputName,
    ]);

    // ffmpeg.wasm's exec resolves with the process exit code instead of
    // throwing on failure. The old code ignored it and stumbled into an
    // opaque FS error when reading the missing output file; surface the
    // real failure with ffmpeg's own last log lines instead.
    if (typeof exitCode === "number" && exitCode !== 0) {
      const detail = logTail.slice(-4).join(" | ");
      throw new Error(
        `FFmpeg exited with code ${exitCode}${detail ? `: ${detail}` : ""}`,
      );
    }

    const data = await instance.readFile(opts.outputName);
    // readFile returns Uint8Array (binary mode) or string (utf8). We always
    // use binary mode here so the cast to Uint8Array is safe.
    const bytes = data as Uint8Array;
    const buf = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;

    // Cleanup so repeated conversions don't accumulate FS entries.
    try {
      await instance.deleteFile(opts.inputName);
      await instance.deleteFile(opts.outputName);
    } catch {
      // Non-fatal, the FS is in-memory and will be garbage-collected anyway.
    }

    return new Blob([buf], { type: opts.outputMime });
  } catch (err) {
    // A failed/aborted exec can leave the shared wasm module unusable. Drop the
    // cached instance so the next queued job (e.g. the rest of a batch) rebuilds
    // a clean one instead of inheriting the poison. See discardFFmpeg.
    discardFFmpeg(instance);
    throw err;
  } finally {
    try {
      instance.off("progress", progressHandler);
      instance.off("log", logHandler);
    } catch {
      // Instance may already be terminated; ignore.
    }
  }
}
