/**
 * Music sheet rendering batch tests. Verovio (WASM) initialises
 * cleanly in the Node test env, so musicxml-to-svg runs end to end
 * here. musicxml-to-pdf needs DOM canvas for the SVG->PNG step and
 * lives in the browser suite; covered here by shape tests only.
 *
 * Non-shallow: re-asserts the SVG output is a real Verovio render,
 * not just any string with "<svg" in it (checks for the engraving
 * markers Verovio always emits).
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { getMeta } from "../src/lib/engine/registry-meta";
import { FIXTURES, fileFromText } from "./fixtures/text-fixtures";

describe("musicxml-to-svg (Verovio, node)", () => {
  it("renders a real Verovio SVG with staff and note glyphs", async () => {
    const result = await run(
      "musicxml-to-svg",
      fileFromText(
        "song.musicxml",
        FIXTURES.musicXml,
        "application/vnd.recordare.musicxml+xml",
      ),
    );
    expect(result.blob.type).toContain("svg+xml");
    const svg = await result.blob.text();
    // Real SVG document with width/height attributes.
    expect(svg).toMatch(/<svg[^>]+width="\d+/);
    expect(svg).toMatch(/<svg[^>]+height="\d+/);
    // Verovio emits <g> grouping elements for every measure / staff /
    // chord. If the renderer fell over silently we would see <svg>
    // with no body content.
    expect(svg).toContain("<g");
    // Has either a staff line or a note glyph; both confirm the render
    // succeeded vs the loader writing an empty page.
    expect(svg).toMatch(/(staff|notehead|note|stem)/i);
    expect(svg.length).toBeGreaterThan(1000);
  }, 60000);

  it("rejects MusicXML the Verovio loader cannot parse", async () => {
    await expect(
      run(
        "musicxml-to-svg",
        fileFromText(
          "broken.musicxml",
          "<this-is-not>musicxml</this-is-not>",
          "application/vnd.recordare.musicxml+xml",
        ),
      ),
    ).rejects.toThrow();
  });
});

describe("musicxml-to-pdf + mxl-to-svg: registry shape (browser-only end to end)", () => {
  for (const id of ["musicxml-to-pdf", "mxl-to-svg"] as const) {
    it(`${id} is registered with the right meta`, () => {
      const meta = getMeta(id);
      expect(meta).toBeDefined();
      expect(meta!.toMime).toMatch(/(pdf|svg)/);
    });
    it(`${id} runner rejects a .csv wrong-extension input`, async () => {
      await expect(
        run(id, fileFromText("wrong.csv", "not music", "text/csv")),
      ).rejects.toThrow(/expects .* but got "wrong\.csv"/);
    });
  }
  it("mxl-to-svg accepts .mxl, musicxml-to-pdf accepts .musicxml", () => {
    expect(getMeta("mxl-to-svg")!.accept).toContain(".mxl");
    expect(getMeta("musicxml-to-pdf")!.accept).toContain(".musicxml");
  });
});
