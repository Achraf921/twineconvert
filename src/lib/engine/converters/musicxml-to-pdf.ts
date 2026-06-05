import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { renderMusicXmlToSvg } from "../util/verovio";
import { imagesToPdf, pdfFilename } from "../util/image-to-pdf";
import { svgToPngBlob } from "../util/svg-raster";

/**
 * MusicXML → PDF. Renders the score to SVG via Verovio (same path as
 * musicxml-to-svg), then rasterises the SVG to PNG via canvas and
 * wraps that PNG into a PDF using our shared imagesToPdf helper.
 *
 * Browser-only: the canvas rasterisation step needs DOM. End result
 * is a one-page-per-Verovio-page PDF you can hand to a musician or
 * print on letter paper.
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

      const pngBlob = await svgToPngBlob(svg);
      opts?.onProgress?.(0.85);
      pdfBlob = await imagesToPdf([pngBlob], { embedType: "image/png" });
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
