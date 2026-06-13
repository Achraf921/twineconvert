/**
 * Browser tests against committed real binary fixtures, with content
 * preservation checks.
 *
 *   - AVIF (sample.avif): pink-on-mostly-white reference. avif-to-png
 *     is the lossless reference; jpg/webp outputs must match it.
 *   - TIFF (sample.tif): 8x8 grayscale gradient hand-encoded.
 *   - AVIF encoders: round-trip through canvas test pattern, decoded
 *     back via avif-to-png to confirm the encoder didn't garble content.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { run } from "../../src/lib/engine/runner";
import {
  loadFixtureSync,
  expectMagic,
  MAGIC,
  makeTestPatternPng,
  makeTestPatternJpeg,
  makeTestPatternWebp,
  fileFromBlob,
} from "./helpers";
import { assertImageQuality } from "./quality";

let avifReferencePng: Blob;
let tifReferencePng: Blob;

describe("AVIF converters (browser, real fixture)", () => {
  beforeAll(async () => {
    const r = await run("avif-to-png", loadFixtureSync("sample.avif"));
    avifReferencePng = r.blob;
  });

  it("avif-to-png is the lossless reference", async () => {
    expect(avifReferencePng.size).toBeGreaterThan(0);
    const head = new Uint8Array(await avifReferencePng.slice(0, 4).arrayBuffer());
    expect(head[0]).toBe(0x89);
  });

  it("avif-to-jpg matches the PNG reference", async () => {
    const result = await run("avif-to-jpg", loadFixtureSync("sample.avif"));
    await expectMagic(result.blob, MAGIC.JPEG);
    await assertImageQuality(avifReferencePng, result.blob, { maxFingerprintDelta: 18 });
  });

  it("avif-to-webp matches the PNG reference", async () => {
    const result = await run("avif-to-webp", loadFixtureSync("sample.avif"));
    await expectMagic(result.blob, MAGIC.WEBP_RIFF);
    await assertImageQuality(avifReferencePng, result.blob, { maxFingerprintDelta: 22 });
  });
});

describe("TIFF converters (browser, hand-encoded fixture)", () => {
  beforeAll(async () => {
    const r = await run("tiff-to-png", loadFixtureSync("sample.tif"));
    tifReferencePng = r.blob;
  });

  it("tiff-to-png is the lossless reference", async () => {
    expect(tifReferencePng.size).toBeGreaterThan(0);
    const head = new Uint8Array(await tifReferencePng.slice(0, 4).arrayBuffer());
    expect(head[0]).toBe(0x89);
  });

  it("tiff-to-jpg matches the PNG reference", async () => {
    const result = await run("tiff-to-jpg", loadFixtureSync("sample.tif"));
    await expectMagic(result.blob, MAGIC.JPEG);
    await assertImageQuality(tifReferencePng, result.blob, { maxFingerprintDelta: 22 });
  });

  it("tiff-to-webp matches the PNG reference", async () => {
    const result = await run("tiff-to-webp", loadFixtureSync("sample.tif"));
    await expectMagic(result.blob, MAGIC.WEBP_RIFF);
    await assertImageQuality(tifReferencePng, result.blob, { maxFingerprintDelta: 22 });
  });

  it("tiff-to-pdf wraps the image in a PDF", async () => {
    const result = await run("tiff-to-pdf", loadFixtureSync("sample.tif"));
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PDF);
  });
});

describe("AVIF encoders (round-trip through canvas test pattern)", () => {
  it("png-to-avif round-trip preserves content", async () => {
    const png = fileFromBlob(await makeTestPatternPng(32, 32), "input.png", "image/png");
    const avif = await run("png-to-avif", png);
    const head = new Uint8Array(await avif.blob.slice(4, 8).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("ftyp");
    // Decode AVIF back to PNG and check content matches the original
    const back = await run(
      "avif-to-png",
      new File([avif.blob], "round.avif", { type: "image/avif" }),
    );
    await assertImageQuality(png, back.blob, { maxFingerprintDelta: 22 });
  }, 60000);

  it("jpg-to-avif round-trip preserves content", async () => {
    const jpg = fileFromBlob(await makeTestPatternJpeg(32, 32), "input.jpg", "image/jpeg");
    const avif = await run("jpg-to-avif", jpg);
    const head = new Uint8Array(await avif.blob.slice(4, 8).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("ftyp");
    const back = await run(
      "avif-to-png",
      new File([avif.blob], "round.avif", { type: "image/avif" }),
    );
    await assertImageQuality(jpg, back.blob, { maxFingerprintDelta: 24 });
  }, 60000);

  it("webp-to-avif round-trip preserves content", async () => {
    const webp = fileFromBlob(await makeTestPatternWebp(32, 32), "input.webp", "image/webp");
    const avif = await run("webp-to-avif", webp);
    const head = new Uint8Array(await avif.blob.slice(4, 8).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("ftyp");
    const back = await run(
      "avif-to-png",
      new File([avif.blob], "round.avif", { type: "image/avif" }),
    );
    await assertImageQuality(webp, back.blob, { maxFingerprintDelta: 24 });
  }, 60000);
});
