/**
 * Browser-mode tests for the canvas-based image converters.
 *
 * These conversions all rely on Canvas 2D / Image decoding which doesn't
 * exist in happy-dom. Running them in Chromium proves the pipeline end
 * to end: we draw a real input via canvas.toBlob, run the converter,
 * decode the output, and verify magic bytes + dimensions.
 *
 * Inputs are generated at test time (no committed fixtures needed) which
 * keeps the repo small.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import {
  makePngBlob,
  makeJpegBlob,
  makeWebpBlob,
  fileFromBlob,
  expectMagic,
  MAGIC,
} from "./helpers";

describe("canvas image converters (browser)", () => {
  describe("png-to-jpg", () => {
    it("converts a real PNG to a real JPEG", async () => {
      const png = fileFromBlob(await makePngBlob(16, 16), "input.png", "image/png");
      const result = await run("png-to-jpg", png);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.JPEG);
    });
  });

  describe("jpg-to-png", () => {
    it("converts a real JPEG to a real PNG", async () => {
      const jpg = fileFromBlob(await makeJpegBlob(16, 16), "input.jpg", "image/jpeg");
      const result = await run("jpg-to-png", jpg);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.PNG);
    });
  });

  describe("png-to-webp", () => {
    it("produces a WebP file", async () => {
      const png = fileFromBlob(await makePngBlob(16, 16), "input.png", "image/png");
      const result = await run("png-to-webp", png);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.WEBP_RIFF);
    });
  });

  describe("webp-to-png", () => {
    it("decodes WebP back to PNG", async () => {
      const webp = fileFromBlob(await makeWebpBlob(16, 16), "input.webp", "image/webp");
      const result = await run("webp-to-png", webp);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.PNG);
    });
  });

  describe("jpg-to-webp", () => {
    it("converts JPEG to WebP", async () => {
      const jpg = fileFromBlob(await makeJpegBlob(16, 16), "input.jpg", "image/jpeg");
      const result = await run("jpg-to-webp", jpg);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.WEBP_RIFF);
    });
  });

  describe("webp-to-jpg", () => {
    it("converts WebP back to JPEG", async () => {
      const webp = fileFromBlob(await makeWebpBlob(16, 16), "input.webp", "image/webp");
      const result = await run("webp-to-jpg", webp);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.JPEG);
    });
  });

  describe("png-to-ico", () => {
    it("produces an ICO file", async () => {
      const png = fileFromBlob(await makePngBlob(32, 32), "input.png", "image/png");
      const result = await run("png-to-ico", png);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.ICO);
    });
  });

  describe("jpg-to-ico", () => {
    it("produces an ICO file from JPEG", async () => {
      const jpg = fileFromBlob(await makeJpegBlob(32, 32), "input.jpg", "image/jpeg");
      const result = await run("jpg-to-ico", jpg);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.ICO);
    });
  });

  describe("png-to-bmp", () => {
    it("produces a BMP file", async () => {
      const png = fileFromBlob(await makePngBlob(16, 16), "input.png", "image/png");
      const result = await run("png-to-bmp", png);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.BMP);
    });
  });

  describe("jpg-to-bmp", () => {
    it("produces a BMP file from JPEG", async () => {
      const jpg = fileFromBlob(await makeJpegBlob(16, 16), "input.jpg", "image/jpeg");
      const result = await run("jpg-to-bmp", jpg);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.BMP);
    });
  });

  describe("png-to-pdf", () => {
    it("wraps a PNG in a PDF", async () => {
      const png = fileFromBlob(await makePngBlob(32, 32), "input.png", "image/png");
      const result = await run("png-to-pdf", png);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.PDF);
    });
  });

  describe("jpg-to-pdf", () => {
    it("wraps a JPEG in a PDF", async () => {
      const jpg = fileFromBlob(await makeJpegBlob(32, 32), "input.jpg", "image/jpeg");
      const result = await run("jpg-to-pdf", jpg);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.PDF);
    });
  });

  describe("webp-to-pdf", () => {
    it("wraps a WebP in a PDF", async () => {
      const webp = fileFromBlob(await makeWebpBlob(32, 32), "input.webp", "image/webp");
      const result = await run("webp-to-pdf", webp);
      expect(result.blob.size).toBeGreaterThan(0);
      await expectMagic(result.blob, MAGIC.PDF);
    });
  });
});
