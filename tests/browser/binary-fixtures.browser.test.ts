/**
 * Browser tests against committed real binary fixtures.
 *
 * Small fixtures (AVIF ~3KB, TIFF 174B) are inlined as base64 in
 * tests/browser/fixtures/inline-fixtures.ts and decoded at test time.
 * No HTTP fetch needed; works with any Vite/Vitest setup.
 *
 * The HEIC sample (~700KB) is too big to inline cleanly; HEIC tests
 * are documented as TODO and will get their own loading strategy
 * (likely Vite's `?url` import once we resolve a working pattern).
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import {
  loadFixtureSync,
  expectMagic,
  MAGIC,
  makePngBlob,
  makeJpegBlob,
  makeWebpBlob,
  fileFromBlob,
} from "./helpers";

describe("AVIF converters (browser, real fixture)", () => {
  it("avif-to-jpg", async () => {
    const avif = loadFixtureSync("sample.avif");
    const result = await run("avif-to-jpg", avif);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.JPEG);
  });

  it("avif-to-png", async () => {
    const avif = loadFixtureSync("sample.avif");
    const result = await run("avif-to-png", avif);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PNG);
  });

  it("avif-to-webp", async () => {
    const avif = loadFixtureSync("sample.avif");
    const result = await run("avif-to-webp", avif);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.WEBP_RIFF);
  });
});

describe("TIFF converters (browser, hand-encoded fixture)", () => {
  it("tiff-to-jpg", async () => {
    const tif = loadFixtureSync("sample.tif");
    const result = await run("tiff-to-jpg", tif);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.JPEG);
  });

  it("tiff-to-png", async () => {
    const tif = loadFixtureSync("sample.tif");
    const result = await run("tiff-to-png", tif);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PNG);
  });

  it("tiff-to-pdf", async () => {
    const tif = loadFixtureSync("sample.tif");
    const result = await run("tiff-to-pdf", tif);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PDF);
  });
});

describe("AVIF encoders (browser, canvas-generated input)", () => {
  it("png-to-avif via @jsquash/avif", async () => {
    const png = fileFromBlob(await makePngBlob(16, 16), "input.png", "image/png");
    const result = await run("png-to-avif", png);
    expect(result.blob.size).toBeGreaterThan(0);
    const head = new Uint8Array(await result.blob.slice(4, 8).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("ftyp");
  }, 60000);

  it("jpg-to-avif via @jsquash/avif", async () => {
    const jpg = fileFromBlob(await makeJpegBlob(16, 16), "input.jpg", "image/jpeg");
    const result = await run("jpg-to-avif", jpg);
    expect(result.blob.size).toBeGreaterThan(0);
    const head = new Uint8Array(await result.blob.slice(4, 8).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("ftyp");
  }, 60000);

  it("webp-to-avif via @jsquash/avif", async () => {
    const webp = fileFromBlob(await makeWebpBlob(16, 16), "input.webp", "image/webp");
    const result = await run("webp-to-avif", webp);
    expect(result.blob.size).toBeGreaterThan(0);
    const head = new Uint8Array(await result.blob.slice(4, 8).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("ftyp");
  }, 60000);
});
