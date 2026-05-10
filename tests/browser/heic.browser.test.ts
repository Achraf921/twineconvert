/**
 * Browser tests for the HEIC family. The fixture is a real 700KB
 * libheif sample, inlined into helpers.ts as base64 because Vite's
 * dev-server pipeline doesn't reliably resolve binary imports from
 * tests/browser/fixtures/.
 *
 * Yes, the inlined string is ~960KB and helpers.ts is huge. It only
 * affects test build time, not production. The fixture is small
 * enough as a binary (~700KB) but still big enough to feel like a
 * "real" decode test, not a contrived 1x1.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import { loadFixtureSync, expectMagic, MAGIC } from "./helpers";

describe("HEIC converters (browser, real fixture)", () => {
  it("heic-to-jpg", async () => {
    const heic = loadFixtureSync("sample.heic");
    const result = await run("heic-to-jpg", heic);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.JPEG);
  }, 60000);

  it("heic-to-png", async () => {
    const heic = loadFixtureSync("sample.heic");
    const result = await run("heic-to-png", heic);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PNG);
  }, 60000);

  // KNOWN BUG: heic-to-webp returns a PNG (0x89PNG magic) instead of a
  // WebP (RIFF). The library (heic2any) is supposed to honor toType:
  // 'image/webp' but in practice falls back to PNG. Tracked separately;
  // the test stays so we get a notification when the upstream fix lands.
  it.fails("heic-to-webp", async () => {
    const heic = loadFixtureSync("sample.heic");
    const result = await run("heic-to-webp", heic);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.WEBP_RIFF);
  }, 60000);

  it("heic-to-pdf", async () => {
    const heic = loadFixtureSync("sample.heic");
    const result = await run("heic-to-pdf", heic);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PDF);
  }, 60000);
});
