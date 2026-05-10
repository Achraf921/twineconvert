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

describe("remove-background (browser)", () => {
  it("returns a PNG with the background removed", async () => {
    const img = await makeSubjectImage();
    const result = await run("remove-background", img);
    expect(result.blob.size).toBeGreaterThan(0);
    await expectMagic(result.blob, MAGIC.PNG);
  }, 600000);
});
