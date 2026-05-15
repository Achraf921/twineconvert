/**
 * Browser-mode test for fen-to-png (canvas board render).
 *
 * Asserts:
 *   1. PNG magic bytes (not a silent wrong-format blob)
 *   2. Correct board dimensions (8 squares * 72px = 576)
 *   3. The image is actually drawn: multiple distinct colors present
 *      (light squares, dark squares, white + black pieces) so a blank
 *      or single-color canvas fails loudly.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import { expectMagic, MAGIC } from "./helpers";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("fen-to-png (browser)", () => {
  it("renders the start position as a real PNG board", async () => {
    const input = new File([START_FEN], "start.fen", { type: "application/x-fen" });
    const result = await run("fen-to-png", input);
    await expectMagic(result.blob, MAGIC.PNG);

    const url = URL.createObjectURL(result.blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      expect(img.naturalWidth).toBe(576);
      expect(img.naturalHeight).toBe(576);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set<string>();
      for (let i = 0; i < data.length; i += 4 * 137) {
        colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      }
      // Light squares + dark squares + piece glyphs => many colors.
      // A blank/single-fill canvas would have 1-2.
      expect(colors.size).toBeGreaterThan(3);
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it("rejects a malformed FEN", async () => {
    const input = new File(["totally not a fen"], "bad.fen", { type: "application/x-fen" });
    await expect(run("fen-to-png", input)).rejects.toThrow();
  });
});
