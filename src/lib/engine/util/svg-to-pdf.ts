/**
 * Render an SVG string straight into a PDF Blob, vector-preserving.
 *
 * Why this exists: the canvas/img.decode() rasterisation path in
 * svg-raster.ts works for most SVGs but rejects SVGs whose subset of
 * SVG features the browser's image decoder refuses to handle. The
 * canonical PostHog repro was a musicxml-to-pdf submission where
 * Verovio emitted an SVG with `<use href="#smufl-...">` references
 * and possibly `<foreignObject>` blocks — img.decode() refused with
 * "The source image cannot be decoded." This path side-steps the
 * decoder entirely by:
 *
 *   1. Parsing the SVG string into a real DOM element with DOMParser.
 *   2. Walking the DOM with svg2pdf.js, which emits jsPDF vector ops
 *      (paths, text, images) directly. No raster pass, no img.decode.
 *
 * Output stays vector inside the PDF, so the result is sharper at
 * any zoom level than the previous canvas/PNG output AND noticeably
 * smaller (engraved sheet music is paths-only; rasterising it was a
 * ~10x size penalty).
 *
 * Browser-only: needs DOMParser + document.body (svg2pdf.js needs the
 * SVG to be live in the DOM so it can read computed styles).
 */

import { normaliseSvgForRaster } from "./svg-raster";

export async function svgToPdfBlob(rawSvg: string): Promise<Blob> {
  const { svg, width, height } = normaliseSvgForRaster(rawSvg);

  // Parse into a real SVG DOM element. DOMParser with "image/svg+xml"
  // produces a Document whose root is a proper SVGSVGElement.
  const parser = new DOMParser();
  const parsed = parser.parseFromString(svg, "image/svg+xml");
  const parserError = parsed.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      `SVG parse error: ${parserError.textContent?.slice(0, 200) ?? "unknown"}`,
    );
  }
  const svgEl = parsed.documentElement as unknown as SVGSVGElement;

  // svg2pdf.js needs the element to live in the document so it can
  // compute styles. We attach to a hidden container and remove after.
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "-10000px";
  host.style.visibility = "hidden";
  host.style.pointerEvents = "none";
  // Adopt the SVG into the main document (it came from a different
  // Document via DOMParser).
  const adopted = document.importNode(svgEl, true);
  host.appendChild(adopted);
  document.body.appendChild(host);

  try {
    const { jsPDF } = await import("jspdf");
    // Use points so 1 SVG px ≈ 1 PDF point. Verovio's default scale
    // matches printed staff sizes acceptably at 1:1.
    const pdf = new jsPDF({
      unit: "pt",
      format: [width, height],
      orientation: width > height ? "landscape" : "portrait",
    });
    const mod = await import("svg2pdf.js");
    const svg2pdf = (mod.svg2pdf ?? (mod as { default?: unknown }).default) as (
      el: SVGElement,
      doc: unknown,
      options?: { x?: number; y?: number; width?: number; height?: number },
    ) => Promise<unknown>;

    await svg2pdf(adopted as SVGElement, pdf, {
      x: 0,
      y: 0,
      width,
      height,
    });
    return pdf.output("blob");
  } finally {
    host.remove();
  }
}
