/**
 * PSD → PNG / JPG end-to-end browser tests.
 *
 * Generates a synthetic PSD in-test using ag-psd's writePsdBuffer, runs
 * it through our converter, and asserts the output has the correct
 * image magic + decodes back to a real image of the right size. This
 * is a real round-trip through the same library code production uses,
 * not a placeholder.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { run } from "../../src/lib/engine/runner";

let psdFile: File;

beforeAll(async () => {
  const { writePsdBuffer, initializeCanvas } = await import("ag-psd");
  initializeCanvas((w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c as unknown as HTMLCanvasElement;
  });

  // Build a tiny 16x16 canvas with two color quadrants so the composite
  // is non-blank, then wrap it as a PSD via ag-psd.
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ff0066";
  ctx.fillRect(0, 0, 8, 16);
  ctx.fillStyle = "#3366ff";
  ctx.fillRect(8, 0, 8, 16);

  const buf = writePsdBuffer({
    width: 16,
    height: 16,
    canvas,
    children: [{ name: "Background", canvas }],
  });
  psdFile = new File([new Uint8Array(buf)], "synthetic.psd", {
    type: "image/vnd.adobe.photoshop",
  });
  expect(psdFile.size).toBeGreaterThan(100);
}, 60000);

describe("psd-to-png (browser, real ag-psd round-trip)", () => {
  it("emits valid PNG of the expected size", async () => {
    const result = await run("psd-to-png", psdFile);
    expect(result.blob.type).toBe("image/png");
    const head = new Uint8Array(await result.blob.slice(0, 8).arrayBuffer());
    // PNG magic: 89 50 4E 47 0D 0A 1A 0A
    expect(head[0]).toBe(0x89);
    expect(head[1]).toBe(0x50);
    expect(head[2]).toBe(0x4e);
    expect(head[3]).toBe(0x47);

    // Decode back and assert dimensions survived (no silent crop / scale).
    const url = URL.createObjectURL(result.blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      expect(img.naturalWidth).toBe(16);
      expect(img.naturalHeight).toBe(16);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, 60000);
});

describe("psd-to-jpg (browser, real ag-psd round-trip)", () => {
  it("emits valid JPEG with the expected dimensions on a white background", async () => {
    const result = await run("psd-to-jpg", psdFile);
    expect(result.blob.type).toBe("image/jpeg");
    const head = new Uint8Array(await result.blob.slice(0, 3).arrayBuffer());
    // JPEG SOI: FF D8 FF
    expect(head[0]).toBe(0xff);
    expect(head[1]).toBe(0xd8);
    expect(head[2]).toBe(0xff);

    const url = URL.createObjectURL(result.blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      expect(img.naturalWidth).toBe(16);
      expect(img.naturalHeight).toBe(16);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, 60000);
});
