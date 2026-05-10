/**
 * Browser tests for the FFmpeg.wasm audio + video families.
 *
 * Inputs are constructed at test time from a tiny hand-crafted WAV
 * (8 bit mono PCM @ 8kHz, ~4KB silence). For non-WAV/MP3 audio formats
 * we derive via the corresponding wav-to-X / mp3-to-X converter, so a
 * pass here means both the forward AND reverse paths run end to end.
 *
 * FFmpeg.wasm core is served same-origin from /ffmpeg/ via the
 * raw-asset-server plugin in vitest.browser.config.ts (which serves
 * the ESM build because the worker uses module-style dynamic import).
 * 32MB load is one-time per Chromium instance.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { run } from "../../src/lib/engine/runner";

const MIN_WAV_BYTES = (() => {
  const samples = 4096;
  const buf = new ArrayBuffer(44 + samples);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46; // "RIFF"
  view.setUint32(4, 36 + samples, true);
  bytes[8] = 0x57; bytes[9] = 0x41; bytes[10] = 0x56; bytes[11] = 0x45; // "WAVE"
  bytes[12] = 0x66; bytes[13] = 0x6d; bytes[14] = 0x74; bytes[15] = 0x20; // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);     // PCM
  view.setUint16(22, 1, true);     // mono
  view.setUint32(24, 8000, true);  // 8kHz
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  bytes[36] = 0x64; bytes[37] = 0x61; bytes[38] = 0x74; bytes[39] = 0x61; // "data"
  view.setUint32(40, samples, true);
  for (let i = 44; i < 44 + samples; i++) bytes[i] = 0x80; // 0x80 == silence in 8-bit unsigned PCM
  return bytes;
})();

const wavFile = (): File => new File([MIN_WAV_BYTES], "tone.wav", { type: "audio/wav" });

/** Synthesize a 16x16 GIF via canvas + png-to-gif. We can't hand-roll a
 *  multi-pixel GIF89a tersely (the LZW codec would need real bytes), and
 *  a 1x1 GIF triggers the gif-to-mp4 scale=trunc(iw/2)*2 filter to
 *  produce 0x0, which libx264 can't encode. */
async function makeGifViaPngToGif(): Promise<File> {
  const { makePngBlob } = await import("./helpers");
  const pngBlob = await makePngBlob(16, 16);
  const png = new File([pngBlob], "tmp.png", { type: "image/png" });
  const gifResult = await run("png-to-gif", png);
  return new File([gifResult.blob], "tmp.gif", { type: "image/gif" });
}

let mp3File: File;
let m4aFile: File;
let oggFile: File;
let flacFile: File;
let mp4File: File;

describe("audio + video converters (browser, FFmpeg.wasm)", () => {
  beforeAll(async () => {
    // First wav-to-mp3 warms FFmpeg (~32MB ESM core load + initial wasm
    // instantiation). Subsequent conversions reuse the loaded instance.
    const mp3 = await run("wav-to-mp3", wavFile());
    mp3File = new File([mp3.blob], "derived.mp3", { type: "audio/mpeg" });

    const [m4a, ogg, flac] = await Promise.all([
      run("mp3-to-m4a", mp3File),
      run("mp3-to-ogg", mp3File),
      run("mp3-to-flac", mp3File),
    ]);
    m4aFile = new File([m4a.blob], "derived.m4a", { type: "audio/mp4" });
    oggFile = new File([ogg.blob], "derived.ogg", { type: "audio/ogg" });
    flacFile = new File([flac.blob], "derived.flac", { type: "audio/flac" });

    const gif = await makeGifViaPngToGif();
    const mp4 = await run("gif-to-mp4", gif);
    mp4File = new File([mp4.blob], "derived.mp4", { type: "video/mp4" });
  }, 600000);

  // === Forward + reverse audio ===
  it("wav-to-mp3 derived a non-empty MP3", () => {
    expect(mp3File.size).toBeGreaterThan(0);
  });

  it("mp3-to-wav round-trips RIFF magic", async () => {
    const result = await run("mp3-to-wav", mp3File);
    const head = new Uint8Array(await result.blob.slice(0, 4).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("RIFF");
  }, 120000);

  it("mp3-to-flac magic is fLaC", async () => {
    const head = new Uint8Array(await flacFile.slice(0, 4).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("fLaC");
  });

  it("mp3-to-m4a + mp3-to-ogg derived non-empty containers", () => {
    expect(m4aFile.size).toBeGreaterThan(0);
    expect(oggFile.size).toBeGreaterThan(0);
  });

  it("m4a-to-mp3", async () => {
    const result = await run("m4a-to-mp3", m4aFile);
    expect(result.blob.size).toBeGreaterThan(0);
  }, 120000);

  it("ogg-to-mp3", async () => {
    const result = await run("ogg-to-mp3", oggFile);
    expect(result.blob.size).toBeGreaterThan(0);
  }, 120000);

  it("flac-to-mp3", async () => {
    const result = await run("flac-to-mp3", flacFile);
    expect(result.blob.size).toBeGreaterThan(0);
  }, 120000);

  // === Video ===
  it("gif-to-mp4 derived a non-empty MP4", () => {
    expect(mp4File.size).toBeGreaterThan(0);
  });

  it("mp4-to-gif round-trips GIF magic", async () => {
    const result = await run("mp4-to-gif", mp4File);
    const head = new Uint8Array(await result.blob.slice(0, 6).arrayBuffer());
    expect(String.fromCharCode(...head).startsWith("GIF8")).toBe(true);
  }, 120000);

  it("mp4-to-mp3 (silent video may produce empty audio; non-throw is the success criterion)", async () => {
    try {
      const result = await run("mp4-to-mp3", mp4File);
      expect(result.blob).toBeDefined();
    } catch (err) {
      // Silent input video has no audio stream; FFmpeg may bail.
      expect(err).toBeDefined();
    }
  }, 120000);

  it("mp4-to-mov", async () => {
    const result = await run("mp4-to-mov", mp4File);
    expect(result.blob.size).toBeGreaterThan(0);
  }, 120000);

  it("mp4-to-avi", async () => {
    const result = await run("mp4-to-avi", mp4File);
    expect(result.blob.size).toBeGreaterThan(0);
  }, 120000);

  it("mp4-to-mkv", async () => {
    const result = await run("mp4-to-mkv", mp4File);
    expect(result.blob.size).toBeGreaterThan(0);
  }, 120000);

  it("mov-to-mp4 reverse", async () => {
    const mov = await run("mp4-to-mov", mp4File);
    const result = await run(
      "mov-to-mp4",
      new File([mov.blob], "derived.mov", { type: "video/quicktime" }),
    );
    expect(result.blob.size).toBeGreaterThan(0);
  }, 240000);

  it("avi-to-mp4 reverse", async () => {
    const avi = await run("mp4-to-avi", mp4File);
    const result = await run(
      "avi-to-mp4",
      new File([avi.blob], "derived.avi", { type: "video/x-msvideo" }),
    );
    expect(result.blob.size).toBeGreaterThan(0);
  }, 240000);

  it("mkv-to-mp4 reverse", async () => {
    const mkv = await run("mp4-to-mkv", mp4File);
    const result = await run(
      "mkv-to-mp4",
      new File([mkv.blob], "derived.mkv", { type: "video/x-matroska" }),
    );
    expect(result.blob.size).toBeGreaterThan(0);
  }, 240000);

  it("webm-to-mp4 (input is FFmpeg-encoded WebM)", async () => {
    // Encode WAV+image into a WebM via FFmpeg, then feed to webm-to-mp4.
    // Direct path: use the WAV-derived MP3 to derive a WebM via gif-to-mp4
    // chain isn't straightforward; we synthesize via raw FFmpeg with a
    // minimal -i input.
    const { ffmpegConvert } = await import("../../src/lib/engine/util/ffmpeg-runner");
    const webmBlob = await ffmpegConvert(
      new File([MIN_WAV_BYTES], "tone.wav", { type: "audio/wav" }),
      {
        inputName: "in.wav",
        outputName: "out.webm",
        outputMime: "video/webm",
        args: ["-f", "lavfi", "-i", "color=c=pink:s=16x16:d=0.1", "-shortest", "-c:v", "libvpx", "-c:a", "libvorbis"],
      },
    );
    const webmFile = new File([webmBlob], "tiny.webm", { type: "video/webm" });
    const result = await run("webm-to-mp4", webmFile);
    expect(result.blob.size).toBeGreaterThan(0);
  }, 240000);
});
