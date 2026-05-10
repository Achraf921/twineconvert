/**
 * Browser tests where the input fixture is itself produced by another
 * (already-tested) converter or a tiny hand-crafted blob. This lets us
 * cover BMP, ICO, GIF reverses without committing more binary samples.
 *
 * Pattern: chain canvas-generated PNG to {BMP, ICO, GIF}, then convert
 * those back to PNG/JPG and verify the output. Any drift in either
 * direction lights up.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import {
  makePngBlob,
  fileFromBlob,
  expectMagic,
  MAGIC,
} from "./helpers";

/** Minimal valid 1x1 GIF89a (35 bytes). Single solid pixel, no animation. */
const TINY_GIF89A_BYTES = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a magic
  0x01, 0x00, 0x01, 0x00, // 1x1 dimensions, little-endian
  0x80, 0x00, 0x00,       // global color table flag, color resolution, sort, size
  0xff, 0xff, 0xff, 0x00, 0x00, 0x00, // global color table: white, black
  0x21, 0xf9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, // graphic control extension
  0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, // image descriptor
  0x02, 0x02, 0x44, 0x01, 0x00, // LZW-compressed image data
  0x3b, // trailer
]);

function tinyGifFile(): File {
  return new File([TINY_GIF89A_BYTES], "tiny.gif", { type: "image/gif" });
}

describe("BMP reverse converters (browser)", () => {
  it("bmp-to-png", async () => {
    const png = fileFromBlob(await makePngBlob(8, 8), "src.png", "image/png");
    const bmp = await run("png-to-bmp", png);
    const out = await run("bmp-to-png", new File([bmp.blob], "round.bmp", { type: "image/bmp" }));
    await expectMagic(out.blob, MAGIC.PNG);
  });

  it("bmp-to-jpg", async () => {
    const png = fileFromBlob(await makePngBlob(8, 8), "src.png", "image/png");
    const bmp = await run("png-to-bmp", png);
    const out = await run("bmp-to-jpg", new File([bmp.blob], "round.bmp", { type: "image/bmp" }));
    await expectMagic(out.blob, MAGIC.JPEG);
  });
});

describe("ICO reverse converters (browser)", () => {
  it("ico-to-png", async () => {
    const png = fileFromBlob(await makePngBlob(32, 32), "src.png", "image/png");
    const ico = await run("png-to-ico", png);
    const out = await run("ico-to-png", new File([ico.blob], "round.ico", { type: "image/x-icon" }));
    await expectMagic(out.blob, MAGIC.PNG);
  });

  it("ico-to-jpg", async () => {
    const png = fileFromBlob(await makePngBlob(32, 32), "src.png", "image/png");
    const ico = await run("png-to-ico", png);
    const out = await run("ico-to-jpg", new File([ico.blob], "round.ico", { type: "image/x-icon" }));
    await expectMagic(out.blob, MAGIC.JPEG);
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
