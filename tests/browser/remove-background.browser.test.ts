/**
 * Browser test for remove-background. Uses an ONNX model for subject
 * detection; first run downloads ~50MB of model data, so the timeout
 * is generous.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import { expectMagic, MAGIC } from "./helpers";

async function makeSubjectImage(): Promise<File> {
  // Render a clear shape (pink circle) on a white background. The
  // background-removal model has an easy job: nothing in the corners,
  // a single contiguous subject in the middle.
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context unavailable");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#E0297B";
  ctx.beginPath();
  ctx.arc(128, 128, 80, 0, Math.PI * 2);
  ctx.fill();
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(new File([b], "subject.png", { type: "image/png" })) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

describe("remove-background (browser, content-checked)", () => {
  it("returns a transparent-corner PNG of the same dimensions", async () => {
    const img = await makeSubjectImage();
    const result = await run("remove-background", img);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PNG);

    // Decode output and verify:
    //   1. dimensions match input (no crop / scale)
    //   2. corners (background area) are transparent (alpha 0 or close)
    //   3. center (subject area) still has color (alpha > 0)
    const url = URL.createObjectURL(result.blob);
    const decoded = await new Promise<ImageData>((resolve, reject) => {
      const i = new Image();
      i.onload = () => {
        const c = document.createElement("canvas");
        c.width = i.naturalWidth;
        c.height = i.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("ctx unavailable"));
        ctx.drawImage(i, 0, 0);
        resolve(ctx.getImageData(0, 0, c.width, c.height));
      };
      i.onerror = () => reject(new Error("decode failed"));
      i.src = url;
    });
    URL.revokeObjectURL(url);

    expect(decoded.width).toBe(256);
    expect(decoded.height).toBe(256);

    // Corner pixel alpha (background area, should be ~transparent)
    const cornerAlpha = decoded.data[3]; // top-left alpha
    expect(cornerAlpha).toBeLessThan(64);

    // Center pixel alpha (subject area, should be opaque)
    const centerIdx = (128 * decoded.width + 128) * 4;
    expect(decoded.data[centerIdx + 3]).toBeGreaterThan(192);
  }, 600000);
});
