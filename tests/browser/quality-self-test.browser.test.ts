/**
 * Self-test: prove the quality validators reject flips, crops, and
 * content swaps. Without this we can't trust assertImageQuality;
 * with it we know the validator does catch what it claims to catch.
 */

import { describe, it, expect } from "vitest";
import { makeTestPatternPng } from "./helpers";
import { assertImageQuality, assertNotFlipped, imageStats } from "./quality";

async function flipHorizontal(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return new Promise<Blob>((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error("toBlob"))), "image/png"));
}

async function flipVertical(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.translate(0, c.height);
  ctx.scale(1, -1);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return new Promise<Blob>((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error("toBlob"))), "image/png"));
}

async function recolorAllPink(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#E0297B";
  ctx.fillRect(0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return new Promise<Blob>((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error("toBlob"))), "image/png"));
}

describe("quality validator self-test", () => {
  it("identical image passes", async () => {
    const png = await makeTestPatternPng(32, 32);
    await expect(assertImageQuality(png, png)).resolves.toBeUndefined();
  });

  it("horizontal flip is rejected", async () => {
    const png = await makeTestPatternPng(32, 32);
    const flipped = await flipHorizontal(png);
    await expect(assertImageQuality(png, flipped)).rejects.toThrow();
  });

  it("vertical flip is rejected", async () => {
    const png = await makeTestPatternPng(32, 32);
    const flipped = await flipVertical(png);
    await expect(assertImageQuality(png, flipped)).rejects.toThrow();
  });

  it("solid recolor is rejected", async () => {
    const png = await makeTestPatternPng(32, 32);
    const recolored = await recolorAllPink(png);
    await expect(assertImageQuality(png, recolored)).rejects.toThrow();
  });

  it("assertNotFlipped catches horizontal flip", async () => {
    const png = await makeTestPatternPng(32, 32);
    const flipped = await flipHorizontal(png);
    await expect(assertNotFlipped(png, flipped)).rejects.toThrow();
  });

  it("imageStats reports correct dimensions", async () => {
    const png = await makeTestPatternPng(40, 24);
    const stats = await imageStats(png);
    expect(stats.width).toBe(40);
    expect(stats.height).toBe(24);
  });
});
