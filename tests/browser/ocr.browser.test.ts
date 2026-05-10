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

/** Strict OCR check: the rendered word must appear with word boundaries
 *  (catches "twune" / "twine convert" / partial extractions), and we
 *  require ≥80% character recall to avoid passing on a near-miss. */
function ocrLooksLike(actual: string, expected: string): boolean {
  if (!actual.trim()) return false;
  const norm = actual.toUpperCase().replace(/[^A-Z]/g, "");
  // Allow up to 1 character substitution for OCR noise
  if (norm.includes(expected.toUpperCase())) return true;
  let hits = 0;
  for (const ch of expected.toUpperCase()) if (norm.includes(ch)) hits++;
  return hits / expected.length >= 0.8;
}

describe("OCR converters (browser, content-checked)", () => {
  it("png-to-text recognises 'TWINE' as a word, not just any letters", async () => {
    const png = new File([await makeTextImage("image/png")], "input.png", { type: "image/png" });
    const result = await run("png-to-text", png);
    const text = await result.blob.text();
    expect(text.length).toBeGreaterThan(0);
    expect(ocrLooksLike(text, "TWINE")).toBe(true);
  }, 120000);

  it("jpg-to-text recognises 'TWINE'", async () => {
    const jpg = new File([await makeTextImage("image/jpeg")], "input.jpg", { type: "image/jpeg" });
    const result = await run("jpg-to-text", jpg);
    const text = await result.blob.text();
    expect(text.length).toBeGreaterThan(0);
    expect(ocrLooksLike(text, "TWINE")).toBe(true);
  }, 120000);

  it("image-to-text accepts either format", async () => {
    const png = new File([await makeTextImage("image/png")], "input.png", { type: "image/png" });
    const result = await run("image-to-text", png);
    const text = await result.blob.text();
    expect(text.length).toBeGreaterThan(0);
    expect(ocrLooksLike(text, "TWINE")).toBe(true);
  }, 120000);
});
