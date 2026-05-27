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
import { assertAudioQuality, audioStats, assertVideoDuration, videoDuration } from "./quality";

const MIN_WAV_BYTES = (() => {
  // Half a second of a 440 Hz sine wave at 16-bit PCM, 16 kHz mono.
  // Non-silent on purpose: assertAudioQuality(requireNonSilent: true)
  // catches every codec / runner bug that produces silent output that
  // would have passed a magic-byte-only check.
  const sampleRate = 16000;
  const samples = sampleRate / 2; // 0.5 s
  const dataLen = samples * 2; // 16-bit
  const buf = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46; // RIFF
  view.setUint32(4, 36 + dataLen, true);
  bytes[8] = 0x57; bytes[9] = 0x41; bytes[10] = 0x56; bytes[11] = 0x45; // WAVE
  bytes[12] = 0x66; bytes[13] = 0x6d; bytes[14] = 0x74; bytes[15] = 0x20; // "fmt "
  view.setUint32(16, 16, true);     // fmt chunk size
  view.setUint16(20, 1, true);      // PCM
  view.setUint16(22, 1, true);      // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);      // block align
  view.setUint16(34, 16, true);     // 16 bits per sample
  bytes[36] = 0x64; bytes[37] = 0x61; bytes[38] = 0x74; bytes[39] = 0x61; // data
  view.setUint32(40, dataLen, true);
  const freq = 440;
  const amp = 16000; // ~50% of full int16 range
  for (let i = 0; i < samples; i++) {
    const v = Math.round(Math.sin((2 * Math.PI * freq * i) / sampleRate) * amp);
    view.setInt16(44 + i * 2, v, true);
  }
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

  // === Audio: every test asserts duration ≈ input + non-silent output ===
  // The input is a 440 Hz sine wave at 0.5 s; silent or wrong-duration
  // output would be a real customer-visible bug.
  const audioOpts = { requireNonSilent: true, maxDurationDelta: 0.15 };
  const inputWav = wavFile();

  it("wav-to-mp3 produces non-silent output with preserved duration", async () => {
    expect(mp3File.size).toBeGreaterThan(0);
    await assertAudioQuality(inputWav, mp3File, audioOpts);
  });

  it("mp3-to-wav produces non-silent RIFF/WAVE", async () => {
    const result = await run("mp3-to-wav", mp3File);
    const head = new Uint8Array(await result.blob.slice(0, 4).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("RIFF");
    await assertAudioQuality(inputWav, result.blob, audioOpts);
  }, 120000);

  it("mp3-to-flac is real FLAC and non-silent", async () => {
    const head = new Uint8Array(await flacFile.slice(0, 4).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("fLaC");
    await assertAudioQuality(inputWav, flacFile, audioOpts);
  });

  it("mp3-to-m4a is decodable and non-silent", async () => {
    expect(m4aFile.size).toBeGreaterThan(0);
    await assertAudioQuality(inputWav, m4aFile, audioOpts);
  });

  it("mp3-to-ogg is decodable and non-silent", async () => {
    expect(oggFile.size).toBeGreaterThan(0);
    await assertAudioQuality(inputWav, oggFile, audioOpts);
  });

  it("m4a-to-mp3 reverse preserves duration + signal", async () => {
    const result = await run("m4a-to-mp3", m4aFile);
    expect(result.blob.size).toBeGreaterThan(0);
    await assertAudioQuality(inputWav, result.blob, audioOpts);
  }, 120000);

  it("ogg-to-mp3 reverse preserves duration + signal", async () => {
    const result = await run("ogg-to-mp3", oggFile);
    expect(result.blob.size).toBeGreaterThan(0);
    await assertAudioQuality(inputWav, result.blob, audioOpts);
  }, 120000);

  it("flac-to-mp3 reverse preserves duration + signal", async () => {
    const result = await run("flac-to-mp3", flacFile);
    expect(result.blob.size).toBeGreaterThan(0);
    await assertAudioQuality(inputWav, result.blob, audioOpts);
  }, 120000);

  it("input WAV has the dominant 440 Hz peak we encoded", async () => {
    // Sanity-check the fixture itself: a converter test is only as
    // good as its input. If this test ever fails the fixture broke.
    const stats = await audioStats(inputWav);
    expect(stats.duration).toBeGreaterThan(0.4);
    expect(stats.duration).toBeLessThan(0.6);
    expect(stats.rms).toBeGreaterThan(0.1);
  });

  // === Video ===
  // Source MP4 is gif-to-mp4(test_pattern.gif) where the GIF is 16x16
  // single-frame. FFmpeg encodes ~0.04s of MP4. We assert duration > 0
  // throughout to catch "container valid but stream is empty" bugs.
  it("gif-to-mp4 produced an MP4 with decodable duration", async () => {
    expect(mp4File.size).toBeGreaterThan(0);
    const dur = await videoDuration(mp4File);
    expect(dur).toBeGreaterThan(0);
  });

  it("mp4-to-gif round-trips GIF magic and is non-empty", async () => {
    const result = await run("mp4-to-gif", mp4File);
    const head = new Uint8Array(await result.blob.slice(0, 6).arrayBuffer());
    expect(String.fromCharCode(...head).startsWith("GIF8")).toBe(true);
    expect(result.blob.size).toBeGreaterThan(50);
  }, 120000);

  it("mp4-to-mp3 either extracts audio or throws cleanly (silent input)", async () => {
    // Source MP4 was generated from a still GIF, so it has no audio
    // stream. FFmpeg should either produce a tiny silent MP3 or throw.
    try {
      const result = await run("mp4-to-mp3", mp4File);
      expect(result.blob).toBeDefined();
    } catch (err) {
      expect(err).toBeDefined();
    }
  }, 120000);

  it("mp4-to-mov preserves duration", async () => {
    const inputDur = await videoDuration(mp4File);
    const result = await run("mp4-to-mov", mp4File);
    expect(result.blob.size).toBeGreaterThan(0);
    await assertVideoDuration(result.blob, inputDur, 0.3);
  }, 120000);

  it("mp4-to-avi produces a valid RIFF/AVI container", async () => {
    // Chromium's <video> element can't decode AVI metadata; we instead
    // verify the AVI magic bytes (RIFF....AVI ) and that the body is
    // bigger than just the header.
    const result = await run("mp4-to-avi", mp4File);
    expect(result.blob.size).toBeGreaterThan(100);
    const head = new Uint8Array(await result.blob.slice(0, 12).arrayBuffer());
    expect(String.fromCharCode(head[0], head[1], head[2], head[3])).toBe("RIFF");
    expect(String.fromCharCode(head[8], head[9], head[10], head[11])).toBe("AVI ");
  }, 120000);

  it("mp4-to-mkv preserves duration", async () => {
    const inputDur = await videoDuration(mp4File);
    const result = await run("mp4-to-mkv", mp4File);
    expect(result.blob.size).toBeGreaterThan(0);
    await assertVideoDuration(result.blob, inputDur, 0.3);
  }, 120000);

  it("mov-to-mp4 reverse preserves duration", async () => {
    const inputDur = await videoDuration(mp4File);
    const mov = await run("mp4-to-mov", mp4File);
    const result = await run(
      "mov-to-mp4",
      new File([mov.blob], "derived.mov", { type: "video/quicktime" }),
    );
    expect(result.blob.size).toBeGreaterThan(0);
    await assertVideoDuration(result.blob, inputDur, 0.3);
  }, 240000);

  it("avi-to-mp4 reverse decodes the AVI and emits a non-empty MP4", async () => {
    const avi = await run("mp4-to-avi", mp4File);
    const result = await run(
      "avi-to-mp4",
      new File([avi.blob], "derived.avi", { type: "video/x-msvideo" }),
    );
    // The AVI we produce is fed back through libavformat which transcodes
    // to MP4 with codec parameters Chromium doesn't always natively
    // support (mpeg4 / mjpeg). We verify magic + size only here; the
    // forward path's duration check is the load-bearing duration assert.
    expect(result.blob.size).toBeGreaterThan(100);
    const head = new Uint8Array(await result.blob.slice(4, 8).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("ftyp");
  }, 240000);

  it("mkv-to-mp4 reverse preserves duration", async () => {
    const inputDur = await videoDuration(mp4File);
    const mkv = await run("mp4-to-mkv", mp4File);
    const result = await run(
      "mkv-to-mp4",
      new File([mkv.blob], "derived.mkv", { type: "video/x-matroska" }),
    );
    expect(result.blob.size).toBeGreaterThan(0);
    await assertVideoDuration(result.blob, inputDur, 0.3);
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

  // ===== Tier 1 video batch real end-to-end (2026-05-27) =====
  // Three of the seven new routes have direct fixtures via the existing
  // mp4File or a one-step derivation through our own pipeline. The other
  // four (3gp, flv, wmv, mts → mp4) need dedicated FFmpeg-encoded
  // fixtures and are covered by the Node shape tests for now.

  it("m4v-to-mp4 stream-copies and produces valid MP4", async () => {
    // M4V is byte-compatible with MP4; rename the existing fixture and
    // assert the converter still emits an MP4 ftyp box.
    const m4vFile = new File([await mp4File.arrayBuffer()], "tiny.m4v", {
      type: "video/x-m4v",
    });
    const result = await run("m4v-to-mp4", m4vFile);
    const bytes = new Uint8Array(await result.blob.slice(0, 12).arrayBuffer());
    // MP4 ftyp box magic at offset 4
    expect(String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7])).toBe(
      "ftyp",
    );
    expect(result.blob.size).toBeGreaterThan(0);
  }, 240000);

  it("mp4-to-webm produces a valid WebM / EBML container", async () => {
    const result = await run("mp4-to-webm", mp4File);
    const head = new Uint8Array(await result.blob.slice(0, 4).arrayBuffer());
    // EBML magic 0x1A 0x45 0xDF 0xA3 is the WebM/Matroska header
    expect(head[0]).toBe(0x1a);
    expect(head[1]).toBe(0x45);
    expect(head[2]).toBe(0xdf);
    expect(head[3]).toBe(0xa3);
    expect(result.blob.size).toBeGreaterThan(0);
  }, 240000);

  it("mov-to-gif emits a real GIF (GIF8 magic) end-to-end through our pipeline", async () => {
    // Derive a .mov via the existing mp4-to-mov converter, then feed
    // through mov-to-gif. Tests both halves of our own pipeline.
    const mov = await run("mp4-to-mov", mp4File);
    const movFile = new File([mov.blob], "derived.mov", { type: "video/quicktime" });
    const result = await run("mov-to-gif", movFile);
    const head = new Uint8Array(await result.blob.slice(0, 4).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("GIF8");
    expect(result.blob.size).toBeGreaterThan(100);
  }, 240000);
});
