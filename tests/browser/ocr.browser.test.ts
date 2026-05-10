/**
 * Browser tests for the OCR converters (image to text).
 *
 * Tesseract.js downloads ~10MB of language data on first run, so each
 * test gets a generous timeout. We render a high-contrast black-on-white
 * "TWINE" string onto a canvas, encode to PNG/JPG, then OCR back.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";

async function makeTextImage(format: "image/png" | "image/jpeg"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context unavailable");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.font = "bold 64px sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("TWINE", 30, 15);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), format, 0.95);
  });
}

describe("OCR converters (browser)", () => {
  it("png-to-text recognises the rendered string", async () => {
    const png = new File([await makeTextImage("image/png")], "input.png", { type: "image/png" });
    const result = await run("png-to-text", png);
    const text = await result.blob.text();
    expect(text.toLowerCase()).toMatch(/twine/i);
  }, 120000);

  it("jpg-to-text recognises the rendered string", async () => {
    const jpg = new File([await makeTextImage("image/jpeg")], "input.jpg", { type: "image/jpeg" });
    const result = await run("jpg-to-text", jpg);
    const text = await result.blob.text();
    expect(text.toLowerCase()).toMatch(/twine/i);
  }, 120000);

  it("image-to-text accepts either format", async () => {
    const png = new File([await makeTextImage("image/png")], "input.png", { type: "image/png" });
    const result = await run("image-to-text", png);
    const text = await result.blob.text();
    expect(text.toLowerCase()).toMatch(/twine/i);
  }, 120000);
});
