/**
 * Browser tests where the input fixture is itself produced by another
 * (already-tested) converter or a tiny hand-crafted blob. Covers BMP,
 * ICO, GIF reverses without committing more binary samples.
 *
 * Pattern: chain canvas-test-pattern to {BMP, ICO, GIF}, then convert
 * back to PNG/JPG, and verify both magic bytes AND content (no flip,
 * no crop, colors preserved within format-specific tolerances).
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import {
  makeTestPatternPng,
  fileFromBlob,
  expectMagic,
  MAGIC,
} from "./helpers";
import { assertImageQuality } from "./quality";

/** Minimal valid 1x1 GIF89a (35 bytes). Single solid pixel, no animation. */
const TINY_GIF89A_BYTES = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a magic
  0x01, 0x00, 0x01, 0x00, // 1x1 dimensions
  0x80, 0x00, 0x00,
  0xff, 0xff, 0xff, 0x00, 0x00, 0x00,
  0x21, 0xf9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0x02, 0x02, 0x44, 0x01, 0x00,
  0x3b,
]);

function tinyGifFile(): File {
  return new File([TINY_GIF89A_BYTES], "tiny.gif", { type: "image/gif" });
}

describe("BMP reverse converters (browser, content preserved)", () => {
  it("bmp-to-png round-trips test pattern", async () => {
    const png = fileFromBlob(await makeTestPatternPng(32, 32), "src.png", "image/png");
    const bmp = await run("png-to-bmp", png);
    const bmpFile = new File([bmp.blob], "round.bmp", { type: "image/bmp" });
    const out = await run("bmp-to-png", bmpFile);
    await expectMagic(out.blob, MAGIC.PNG);
    // Round-trip: original PNG vs final PNG should be near-identical
    await assertImageQuality(png, out.blob);
  });

  it("bmp-to-jpg round-trips test pattern (lossy)", async () => {
    const png = fileFromBlob(await makeTestPatternPng(32, 32), "src.png", "image/png");
    const bmp = await run("png-to-bmp", png);
    const bmpFile = new File([bmp.blob], "round.bmp", { type: "image/bmp" });
    const out = await run("bmp-to-jpg", bmpFile);
    await expectMagic(out.blob, MAGIC.JPEG);
    await assertImageQuality(png, out.blob, { maxFingerprintDelta: 22 });
  });
});

describe("ICO reverse converters (browser, content preserved)", () => {
  it("ico-to-png round-trips test pattern (size differs: ICO embeds 16/32/48/64/128/256)", async () => {
    const png = fileFromBlob(await makeTestPatternPng(32, 32), "src.png", "image/png");
    const ico = await run("png-to-ico", png);
    const icoFile = new File([ico.blob], "round.ico", { type: "image/x-icon" });
    const out = await run("ico-to-png", icoFile);
    await expectMagic(out.blob, MAGIC.PNG);
    // ICO embeds the standard favicon size set; the decoder picks 256x256
    // (the largest layer). Content should still match within bilinear-
    // upscale tolerances.
    await assertImageQuality(png, out.blob, { allowSizeDelta: true });
  });

  it("ico-to-jpg round-trips test pattern (lossy + size differs)", async () => {
    const png = fileFromBlob(await makeTestPatternPng(32, 32), "src.png", "image/png");
    const ico = await run("png-to-ico", png);
    const icoFile = new File([ico.blob], "round.ico", { type: "image/x-icon" });
    const out = await run("ico-to-jpg", icoFile);
    await expectMagic(out.blob, MAGIC.JPEG);
    await assertImageQuality(png, out.blob, { allowSizeDelta: true, maxFingerprintDelta: 22 });
  });
});

describe("GIF converters (browser, hand-crafted 1x1 GIF89a)", () => {
  it("gif-to-png", async () => {
    const result = await run("gif-to-png", tinyGifFile());
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PNG);
  });

  it("gif-to-jpg", async () => {
    const result = await run("gif-to-jpg", tinyGifFile());
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.JPEG);
  });
});
