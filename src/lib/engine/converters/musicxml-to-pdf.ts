import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { renderMusicXmlToSvg } from "../util/verovio";
import { imagesToPdf, pdfFilename } from "../util/image-to-pdf";

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

      const pngBlob = await svgToPng(svg);
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

/**
 * Rasterise an SVG string to a PNG Blob via a hidden <img> element +
 * canvas. We size the canvas from the SVG's `width` / `height`
 * attributes (Verovio emits these in pixels by default), falling back
 * to a sensible A4-ish default if missing.
 */
async function svgToPng(svg: string): Promise<Blob> {
  const wMatch = svg.match(/<svg[^>]*\bwidth="(\d+(?:\.\d+)?)(?:px)?"/);
  const hMatch = svg.match(/<svg[^>]*\bheight="(\d+(?:\.\d+)?)(?:px)?"/);
  const width = wMatch ? Math.ceil(parseFloat(wMatch[1])) : 2100;
  const height = hMatch ? Math.ceil(parseFloat(hMatch[1])) : 2970;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    // White background so the printed PDF does not show transparent
    // areas as black if a viewer disables alpha.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default musicxmlToPdf;
