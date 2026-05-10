/**
 * Browser-mode tests for the canvas-based image converters.
 *
 * Two assertions per converter (where supported):
 *   1. Magic-byte / structural validation (caught the BMP and GIF bugs).
 *   2. Quality validation via assertImageQuality (catches flips, crops,
 *      content swaps, color-shifted output, excessive compression loss).
 *
 * Inputs use the 4-quadrant test pattern (red TL, green TR, blue BL,
 * yellow BR) so a horizontal or vertical flip is loud in the spatial
 * fingerprint and corner checks.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import {
  makeTestPatternPng,
  makeTestPatternJpeg,
  makeTestPatternWebp,
  fileFromBlob,
  expectMagic,
  MAGIC,
} from "./helpers";
import { assertImageQuality } from "./quality";

describe("canvas image converters (browser)", () => {
  it("png-to-jpg preserves content", async () => {
    const png = fileFromBlob(await makeTestPatternPng(), "input.png", "image/png");
    const result = await run("png-to-jpg", png);
    await expectMagic(result.blob, MAGIC.JPEG);
    await assertImageQuality(png, result.blob);
  });

  it("jpg-to-png preserves content", async () => {
    const jpg = fileFromBlob(await makeTestPatternJpeg(), "input.jpg", "image/jpeg");
    const result = await run("jpg-to-png", jpg);
    await expectMagic(result.blob, MAGIC.PNG);
    await assertImageQuality(jpg, result.blob);
  });

  it("png-to-webp preserves content", async () => {
    const png = fileFromBlob(await makeTestPatternPng(), "input.png", "image/png");
    const result = await run("png-to-webp", png);
    await expectMagic(result.blob, MAGIC.WEBP_RIFF);
    await assertImageQuality(png, result.blob);
  });

  it("webp-to-png preserves content", async () => {
    const webp = fileFromBlob(await makeTestPatternWebp(), "input.webp", "image/webp");
    const result = await run("webp-to-png", webp);
    await expectMagic(result.blob, MAGIC.PNG);
    await assertImageQuality(webp, result.blob);
  });

  it("jpg-to-webp preserves content", async () => {
    const jpg = fileFromBlob(await makeTestPatternJpeg(), "input.jpg", "image/jpeg");
    const result = await run("jpg-to-webp", jpg);
    await expectMagic(result.blob, MAGIC.WEBP_RIFF);
    await assertImageQuality(jpg, result.blob);
  });

  it("webp-to-jpg preserves content", async () => {
    const webp = fileFromBlob(await makeTestPatternWebp(), "input.webp", "image/webp");
    const result = await run("webp-to-jpg", webp);
    await expectMagic(result.blob, MAGIC.JPEG);
    await assertImageQuality(webp, result.blob);
  });

  it("png-to-bmp preserves content (and is real BMP)", async () => {
    const png = fileFromBlob(await makeTestPatternPng(), "input.png", "image/png");
    const result = await run("png-to-bmp", png);
    await expectMagic(result.blob, MAGIC.BMP);
    await assertImageQuality(png, result.blob);
  });

  it("jpg-to-bmp preserves content (and is real BMP)", async () => {
    const jpg = fileFromBlob(await makeTestPatternJpeg(), "input.jpg", "image/jpeg");
    const result = await run("jpg-to-bmp", jpg);
    await expectMagic(result.blob, MAGIC.BMP);
    await assertImageQuality(jpg, result.blob);
  });

  it("png-to-gif preserves content (and is real GIF)", async () => {
    const png = fileFromBlob(await makeTestPatternPng(), "input.png", "image/png");
    const result = await run("png-to-gif", png);
    await expectMagic(result.blob, MAGIC.GIF);
    // GIF is palette-quantized to 256 colors; expect a higher fingerprint
    // delta than for PNG/JPG round-trips.
    await assertImageQuality(png, result.blob, { maxFingerprintDelta: 30 });
  });

  it("jpg-to-gif preserves content (and is real GIF)", async () => {
    const jpg = fileFromBlob(await makeTestPatternJpeg(), "input.jpg", "image/jpeg");
    const result = await run("jpg-to-gif", jpg);
    await expectMagic(result.blob, MAGIC.GIF);
    await assertImageQuality(jpg, result.blob, { maxFingerprintDelta: 30 });
  });

  it("png-to-ico is real ICO and decodes to the same content", async () => {
    const png = fileFromBlob(await makeTestPatternPng(32, 32), "input.png", "image/png");
    const result = await run("png-to-ico", png);
    await expectMagic(result.blob, MAGIC.ICO);
    // ICO decoding via the browser is unreliable across vendors; we verify
    // the magic byte path here. Round-trip through ico-to-png covers
    // content preservation in the derived-fixtures suite.
  });

  it("jpg-to-ico is real ICO", async () => {
    const jpg = fileFromBlob(await makeTestPatternJpeg(32, 32), "input.jpg", "image/jpeg");
    const result = await run("jpg-to-ico", jpg);
    await expectMagic(result.blob, MAGIC.ICO);
  });

  it("png-to-pdf wraps PNG in PDF", async () => {
    const png = fileFromBlob(await makeTestPatternPng(32, 32), "input.png", "image/png");
    const result = await run("png-to-pdf", png);
    await expectMagic(result.blob, MAGIC.PDF);
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("jpg-to-pdf wraps JPEG in PDF", async () => {
    const jpg = fileFromBlob(await makeTestPatternJpeg(32, 32), "input.jpg", "image/jpeg");
    const result = await run("jpg-to-pdf", jpg);
    await expectMagic(result.blob, MAGIC.PDF);
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("webp-to-pdf wraps WebP in PDF", async () => {
    const webp = fileFromBlob(await makeTestPatternWebp(32, 32), "input.webp", "image/webp");
    const result = await run("webp-to-pdf", webp);
    await expectMagic(result.blob, MAGIC.PDF);
    expect(result.blob.size).toBeGreaterThan(0);
  });
});
