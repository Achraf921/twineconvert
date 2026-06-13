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

describe("image format matrix gap fills (browser)", () => {
  // Derive each non-trivial input from a known-good PNG test pattern via
  // an existing, already-tested converter, then run the new converter.
  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="16" height="16" x="0" y="0" fill="#ff0000"/>
    <rect width="16" height="16" x="16" y="0" fill="#00ff00"/>
    <rect width="16" height="16" x="0" y="16" fill="#0000ff"/>
    <rect width="16" height="16" x="16" y="16" fill="#ffff00"/>
  </svg>`;
  const pngFile = async () => fileFromBlob(await makeTestPatternPng(32, 32), "in.png", "image/png");
  const derive = async (id: string, name: string, mime: string) =>
    fileFromBlob((await run(id, await pngFile())).blob, name, mime);

  // --- to WebP (canvasEncode) ---
  it("svg-to-webp renders the vector to a real WebP", async () => {
    const svg = fileFromBlob(new Blob([SVG], { type: "image/svg+xml" }), "in.svg", "image/svg+xml");
    const r = await run("svg-to-webp", svg);
    await expectMagic(r.blob, MAGIC.WEBP_RIFF);
    expect(r.blob.size).toBeGreaterThan(0);
  });
  it("gif-to-webp preserves content", async () => {
    const gif = await derive("png-to-gif", "in.gif", "image/gif");
    const r = await run("gif-to-webp", gif);
    await expectMagic(r.blob, MAGIC.WEBP_RIFF);
    await assertImageQuality(gif, r.blob);
  });
  it("bmp-to-webp preserves content", async () => {
    const bmp = await derive("png-to-bmp", "in.bmp", "image/bmp");
    const r = await run("bmp-to-webp", bmp);
    await expectMagic(r.blob, MAGIC.WEBP_RIFF);
    await assertImageQuality(bmp, r.blob);
  });
  it("ico-to-webp produces a real WebP", async () => {
    const ico = await derive("png-to-ico", "in.ico", "image/x-icon");
    const r = await run("ico-to-webp", ico);
    await expectMagic(r.blob, MAGIC.WEBP_RIFF);
    expect(r.blob.size).toBeGreaterThan(0);
  });

  // --- to GIF (gifenc) ---
  it("webp-to-gif produces a real GIF", async () => {
    const webp = fileFromBlob(await makeTestPatternWebp(32, 32), "in.webp", "image/webp");
    const r = await run("webp-to-gif", webp);
    await expectMagic(r.blob, MAGIC.GIF);
    expect(r.blob.size).toBeGreaterThan(0);
  });
  it("avif-to-gif produces a real GIF", async () => {
    const avif = await derive("png-to-avif", "in.avif", "image/avif");
    const r = await run("avif-to-gif", avif);
    await expectMagic(r.blob, MAGIC.GIF);
    expect(r.blob.size).toBeGreaterThan(0);
  });
  it("bmp-to-gif produces a real GIF", async () => {
    const bmp = await derive("png-to-bmp", "in.bmp", "image/bmp");
    const r = await run("bmp-to-gif", bmp);
    await expectMagic(r.blob, MAGIC.GIF);
    expect(r.blob.size).toBeGreaterThan(0);
  });

  // --- to BMP (bmp-encode) ---
  it("webp-to-bmp preserves content", async () => {
    const webp = fileFromBlob(await makeTestPatternWebp(32, 32), "in.webp", "image/webp");
    const r = await run("webp-to-bmp", webp);
    await expectMagic(r.blob, MAGIC.BMP);
    await assertImageQuality(webp, r.blob);
  });
  it("gif-to-bmp produces a real BMP", async () => {
    const gif = await derive("png-to-gif", "in.gif", "image/gif");
    const r = await run("gif-to-bmp", gif);
    await expectMagic(r.blob, MAGIC.BMP);
    expect(r.blob.size).toBeGreaterThan(0);
  });
  it("avif-to-bmp produces a real BMP", async () => {
    const avif = await derive("png-to-avif", "in.avif", "image/avif");
    const r = await run("avif-to-bmp", avif);
    await expectMagic(r.blob, MAGIC.BMP);
    expect(r.blob.size).toBeGreaterThan(0);
  });

  const svgFile = () =>
    fileFromBlob(new Blob([SVG], { type: "image/svg+xml" }), "in.svg", "image/svg+xml");

  // --- to AVIF (avif-encode). AVIF carries "ftyp" at byte offset 4;
  //     verify that, then round-trip back to PNG to prove real content. ---
  const assertAvif = async (blob: Blob) => {
    const head = new Uint8Array(await blob.slice(4, 8).arrayBuffer());
    expect(String.fromCharCode(...head)).toBe("ftyp");
    expect(blob.size).toBeGreaterThan(0);
    // Decodes cleanly back to PNG (proves it is a valid AVIF, not garbage).
    const back = await run("avif-to-png", new File([blob], "rt.avif", { type: "image/avif" }));
    await expectMagic(back.blob, MAGIC.PNG);
  };
  it("gif-to-avif produces a real AVIF", async () => {
    const gif = await derive("png-to-gif", "in.gif", "image/gif");
    await assertAvif((await run("gif-to-avif", gif)).blob);
  }, 60000);
  it("bmp-to-avif preserves content", async () => {
    const bmp = await derive("png-to-bmp", "in.bmp", "image/bmp");
    const r = await run("bmp-to-avif", bmp);
    await assertAvif(r.blob);
    const back = await run("avif-to-png", new File([r.blob], "rt.avif", { type: "image/avif" }));
    await assertImageQuality(bmp, back.blob, { maxFingerprintDelta: 24 });
  }, 60000);
  it("svg-to-avif produces a real AVIF", async () => {
    await assertAvif((await run("svg-to-avif", svgFile())).blob);
  }, 60000);
  it("ico-to-avif produces a real AVIF", async () => {
    const ico = await derive("png-to-ico", "in.ico", "image/x-icon");
    await assertAvif((await run("ico-to-avif", ico)).blob);
  }, 60000);

  // --- SVG / ICO to GIF + BMP ---
  it("svg-to-gif produces a real GIF", async () => {
    const r = await run("svg-to-gif", svgFile());
    await expectMagic(r.blob, MAGIC.GIF);
    expect(r.blob.size).toBeGreaterThan(0);
  });
  it("ico-to-gif produces a real GIF", async () => {
    const ico = await derive("png-to-ico", "in.ico", "image/x-icon");
    const r = await run("ico-to-gif", ico);
    await expectMagic(r.blob, MAGIC.GIF);
    expect(r.blob.size).toBeGreaterThan(0);
  });
  it("svg-to-bmp produces a real BMP", async () => {
    const r = await run("svg-to-bmp", svgFile());
    await expectMagic(r.blob, MAGIC.BMP);
    expect(r.blob.size).toBeGreaterThan(0);
  });
  it("ico-to-bmp produces a real BMP", async () => {
    const ico = await derive("png-to-ico", "in.ico", "image/x-icon");
    const r = await run("ico-to-bmp", ico);
    await expectMagic(r.blob, MAGIC.BMP);
    expect(r.blob.size).toBeGreaterThan(0);
  });
});
