/**
 * Browser tests for the HEIC family. The fixture is a real 700KB
 * libheif sample, inlined into helpers.ts as base64.
 *
 * Quality strategy: heic-to-png is the lossless reference. The other
 * HEIC outputs (jpg, webp, pdf-as-image) should match the PNG within
 * format-specific tolerances. Catches the kind of bug where heic2any
 * silently fell back to PNG for image/webp.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { run } from "../../src/lib/engine/runner";
import { loadFixtureSync, expectMagic, MAGIC } from "./helpers";
import { assertImageQuality } from "./quality";

let referencePng: Blob;

describe("HEIC converters (browser, real fixture, content-checked)", () => {
  beforeAll(async () => {
    const heic = loadFixtureSync("sample.heic");
    const r = await run("heic-to-png", heic);
    referencePng = r.blob;
  }, 90000);

  it("heic-to-png is the lossless reference", async () => {
    expect(referencePng.size).toBeGreaterThan(0);
    const head = new Uint8Array(await referencePng.slice(0, 4).arrayBuffer());
    expect(head[0]).toBe(0x89); // PNG magic
  });

  it("heic-to-jpg matches the PNG reference (lossy)", async () => {
    const heic = loadFixtureSync("sample.heic");
    const result = await run("heic-to-jpg", heic);
    await expectMagic(result.blob, MAGIC.JPEG);
    await assertImageQuality(referencePng, result.blob, { maxFingerprintDelta: 18 });
  }, 60000);

  it("heic-to-webp matches the PNG reference (lossy)", async () => {
    const heic = loadFixtureSync("sample.heic");
    const result = await run("heic-to-webp", heic);
    await expectMagic(result.blob, MAGIC.WEBP_RIFF);
    await assertImageQuality(referencePng, result.blob, { maxFingerprintDelta: 22 });
  }, 60000);

  it("heic-to-pdf wraps the image in a PDF", async () => {
    const heic = loadFixtureSync("sample.heic");
    const result = await run("heic-to-pdf", heic);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PDF);
  }, 60000);
});
