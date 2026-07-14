/**
 * Regression tests for the shared FFmpeg instance lifecycle.
 *
 * Production incident (PostHog, July 2026): ogg-to-mp3 showed a ~46% error
 * rate, concentrated in a handful of sessions that each dropped a large batch
 * (hundreds of files), clicked convert once, and produced 300-500 failures in
 * seconds with zero successes and a single repeated error message. Root cause:
 * ffmpeg.wasm shares one wasm module across every conversion, cached for the
 * life of the page. When one file aborted the module, the poisoned instance
 * stayed cached and every remaining file in the batch failed instantly.
 *
 * The fix: a failed job discards the cached instance so the next queued job
 * rebuilds a clean one. These tests drive that with a fake instance factory
 * (real ffmpeg.wasm only runs in a browser).
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  ffmpegConvert,
  __setFFmpegFactoryForTest,
  type FFmpegLike,
} from "../src/lib/engine/util/ffmpeg-runner";

const OPTS = {
  inputName: "in.ogg",
  outputName: "out.mp3",
  outputMime: "audio/mpeg",
  args: ["-codec:a", "libmp3lame", "-q:a", "2"],
};

function input(): Blob {
  return new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/ogg" });
}

/**
 * A fake FFmpeg. `poison` makes exec throw (mimicking a wasm abort);
 * `exitCode` makes exec resolve with a non-zero status after emitting a log
 * line, mimicking how ffmpeg.wasm reports per-file conversion failures.
 */
function fakeInstance(poison: boolean, exitCode = 0): FFmpegLike {
  let dead = false;
  const logHandlers: Array<(e: { message: string }) => void> = [];
  return {
    on(event: string, handler: (e: never) => void) {
      if (event === "log") logHandlers.push(handler as (e: { message: string }) => void);
    },
    off() {},
    async writeFile() {
      if (dead) throw new Error("FS error: instance terminated");
    },
    async exec() {
      if (dead) throw new Error("called exec() on a terminated instance");
      if (poison) throw new Error("Aborted(). Build with -sASSERTIONS for more info.");
      if (exitCode !== 0) {
        for (const h of logHandlers) {
          h({ message: "in.ogg: Invalid data found when processing input" });
        }
        return exitCode;
      }
      return 0;
    },
    async readFile() {
      if (dead) throw new Error("FS error: instance terminated");
      return new Uint8Array([0xff, 0xfb, 0x90]); // MP3 frame header-ish bytes
    },
    async deleteFile() {},
    terminate() {
      dead = true;
    },
  } as FFmpegLike;
}

afterEach(() => {
  __setFFmpegFactoryForTest(null); // restore the real factory
});

describe("ffmpeg-runner instance recovery", () => {
  it("rebuilds a clean instance after a failed job (batch cascade fix)", async () => {
    const built: string[] = [];
    let call = 0;
    __setFFmpegFactoryForTest(async () => {
      call += 1;
      const poison = call === 1; // only the first file poisons
      built.push(poison ? "poison" : "clean");
      return fakeInstance(poison);
    });

    // First file aborts the module and must reject.
    await expect(ffmpegConvert(input(), OPTS)).rejects.toThrow();

    // Second file (the rest of the batch) must get a FRESH instance and
    // succeed. With the old cache-forever behavior it would inherit the dead
    // instance and fail instantly, and no second build would happen.
    const out = await ffmpegConvert(input(), OPTS);
    expect(out).toBeInstanceOf(Blob);
    expect(out.size).toBeGreaterThan(0);
    expect(built).toEqual(["poison", "clean"]);
  });

  it("reuses the cached instance across successful conversions (no needless rebuild)", async () => {
    let builds = 0;
    __setFFmpegFactoryForTest(async () => {
      builds += 1;
      return fakeInstance(false);
    });

    await ffmpegConvert(input(), OPTS);
    await ffmpegConvert(input(), OPTS);
    await ffmpegConvert(input(), OPTS);

    expect(builds).toBe(1);
  });

  it("retries the load after a failed wasm download instead of caching the rejection", async () => {
    // Production signature: one flaky 30MB core download used to poison the
    // whole session, since the rejected load promise stayed cached forever.
    let attempts = 0;
    __setFFmpegFactoryForTest(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("failed to fetch ffmpeg-core.wasm");
      return fakeInstance(false);
    });

    await expect(ffmpegConvert(input(), OPTS)).rejects.toThrow(/ffmpeg-core/);
    // Second conversion must retry the load and succeed.
    const out = await ffmpegConvert(input(), OPTS);
    expect(out.size).toBeGreaterThan(0);
    expect(attempts).toBe(2);
  });

  it("surfaces ffmpeg's exit code and log tail when a conversion fails", async () => {
    // ffmpeg.wasm exec RESOLVES with a non-zero exit code on failure. The old
    // runner ignored it and hit an opaque FS error on the missing output.
    __setFFmpegFactoryForTest(async () => fakeInstance(false, 1));

    await expect(ffmpegConvert(input(), OPTS)).rejects.toThrow(
      /exited with code 1.*Invalid data found/,
    );
  });
});
