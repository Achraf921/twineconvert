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

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
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
      return instance;
    })();
  }
  return ffmpegPromise;
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

  try {
    await instance.writeFile(opts.inputName, await fetchFile(input));
    await instance.exec([
      "-i",
      opts.inputName,
      ...opts.args,
      opts.outputName,
    ]);

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
  } finally {
    instance.off("progress", progressHandler);
  }
}
