/**
 * Browser test for musicxml-to-pdf, the converter that surfaced
 * the production "Invalid encoded image data" / "The source image
 * cannot be decoded" PostHog events.
 *
 * The fix replaced the canvas/img.decode() rasterisation path with
 * a direct SVG -> PDF vector render via svg2pdf.js + jsPDF. These
 * tests exercise:
 *
 *   1. A real Verovio render of a minimal MusicXML score.
 *   2. The svgToPdfBlob helper directly, against an SVG with the
 *      Verovio-flavoured `<defs><symbol/></defs><use href="#sym"/>`
 *      pattern that the previous canvas path failed on. This is
 *      the actual PostHog repro shape.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import { expectMagic, MAGIC } from "./helpers";
import { assertPdfNotBlank } from "./quality";
import { svgToPdfBlob } from "../../src/lib/engine/util/svg-to-pdf";

const TINY_MUSICXML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Voice</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

// The PostHog repro shape: an SVG with internal <symbol> defs and
// <use href> references. The previous canvas/img.decode() path
// rejected this with "The source image cannot be decoded".
const VEROVIO_FLAVOUR_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 200 100">
  <defs>
    <symbol id="g-clef" viewBox="0 0 20 40">
      <path d="M10 0 Q15 10 10 20 Q5 30 10 40" fill="black" stroke="black" stroke-width="1"/>
    </symbol>
  </defs>
  <g class="staff">
    <line x1="0" y1="10" x2="200" y2="10" stroke="black"/>
    <line x1="0" y1="20" x2="200" y2="20" stroke="black"/>
    <line x1="0" y1="30" x2="200" y2="30" stroke="black"/>
    <line x1="0" y1="40" x2="200" y2="40" stroke="black"/>
    <line x1="0" y1="50" x2="200" y2="50" stroke="black"/>
    <use href="#g-clef" x="10" y="5"/>
    <circle cx="80" cy="30" r="5" fill="black"/>
    <line x1="85" y1="30" x2="85" y2="0" stroke="black" stroke-width="2"/>
  </g>
</svg>`;

describe("musicxml-to-pdf (browser, vector path)", () => {
  it("produces a valid PDF from a minimal MusicXML score", async () => {
    const file = new File([TINY_MUSICXML], "score.musicxml", {
      type: "application/vnd.recordare.musicxml+xml",
    });
    const result = await run("musicxml-to-pdf", file);
    expect(result.blob.size).toBeGreaterThan(500);
    await expectMagic(result.blob, MAGIC.PDF);
    await assertPdfNotBlank(result.blob);
    expect(result.filename).toMatch(/\.pdf$/);
  }, 60000);
});

describe("svgToPdfBlob helper (PostHog repro)", () => {
  it("renders Verovio-flavoured <symbol>/<use> SVG without canvas failure", async () => {
    // This is the shape that broke production. The fact that the old
    // canvas path failed here is precisely what motivated the rewrite,
    // so passing this assertion is the regression gate.
    const pdfBlob = await svgToPdfBlob(VEROVIO_FLAVOUR_SVG);
    expect(pdfBlob.size).toBeGreaterThan(500);
    await expectMagic(pdfBlob, MAGIC.PDF);
    await assertPdfNotBlank(pdfBlob);
  });

  it("rejects truly malformed SVG with a clear parse error", async () => {
    await expect(svgToPdfBlob("<not><real><svg>")).rejects.toThrow();
  });

  it("succeeds on a minimal valid SVG without symbols", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="black"/></svg>`;
    const pdfBlob = await svgToPdfBlob(svg);
    expect(pdfBlob.size).toBeGreaterThan(200);
    await expectMagic(pdfBlob, MAGIC.PDF);
  });
});
