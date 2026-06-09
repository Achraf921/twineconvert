import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { renderMusicXmlToSvg } from "../util/verovio";
import { pdfFilename } from "../util/image-to-pdf";
import { svgToPdfBlob } from "../util/svg-to-pdf";

/**
 * MusicXML → PDF. Renders the score to SVG via Verovio (same path as
 * musicxml-to-svg), then writes the SVG directly to a vector PDF via
 * svg2pdf.js + jsPDF. No raster pass: the output stays vector inside
 * the PDF, sharp at any zoom and much smaller than the prior
 * canvas/PNG approach.
 *
 * Browser-only: svg2pdf.js needs a live DOM tree to read computed
 * styles, so the conversion runs against document.body.
 */
const musicxmlToPdf: Converter = {
  id: "musicxml-to-pdf",
  label: "MusicXML → PDF",
  fromMime: [
    "application/vnd.recordare.musicxml+xml",
    "application/vnd.recordare.musicxml",
    "application/xml",
    "text/xml",
  ],
  accept: [".musicxml", ".xml"],
  toMime: "application/pdf",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let pdfBlob: Blob;
    try {
      const text = await input.text();
      const svg = await renderMusicXmlToSvg(text);
      opts?.onProgress?.(0.5);

      pdfBlob = await svgToPdfBlob(svg);
      opts?.onProgress?.(0.95);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render MusicXML to PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob: pdfBlob, filename: pdfFilename(input.name) };
  },
};

export default musicxmlToPdf;
