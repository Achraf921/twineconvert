/**
 * SVG normalisation + rasterisation utilities. Used by converters
 * that pipe a generated SVG through `<img>` + canvas to get a PNG
 * (which then gets embedded in a PDF, or downloaded as is).
 *
 * Background: browsers' `img.decode()` is unforgiving with raw SVG
 * strings. It can reject the input as "Invalid encoded image data"
 * when:
 *   - the SVG has no `xmlns` on its root (some generators omit it)
 *   - there's a leading XML declaration or BOM
 *   - width/height are percentages or missing (only viewBox is set)
 *   - the SVG references undefined CSS or unloadable web fonts
 *
 * `normaliseSvgForRaster` repairs the first three of those cleanly;
 * the font/CSS path is left as is (those normally degrade gracefully
 * to default rendering, they don't kill the decode).
 */

export interface NormaliseResult {
  /** Sanitised SVG string, safe to pass to <img>.src as a data URL. */
  svg: string;
  /** Numeric width in pixels (derived from explicit attr or viewBox). */
  width: number;
  /** Numeric height in pixels (derived from explicit attr or viewBox). */
  height: number;
}

const SVG_XMLNS = 'xmlns="http://www.w3.org/2000/svg"';
// A4-ish default at ~96 DPI (210mm x 297mm). Used when neither width/
// height attrs nor viewBox can be parsed; we still emit a usable image.
const DEFAULT_W = 794;
const DEFAULT_H = 1123;

export function normaliseSvgForRaster(input: string): NormaliseResult {
  let svg = input;

  // Strip leading BOM.
  if (svg.charCodeAt(0) === 0xfeff) svg = svg.slice(1);
  svg = svg.trimStart();

  // Strip XML processing instruction. img.decode() handles it but data:
  // URLs base64-encode poorly with multi-line whitespace and some browsers
  // refuse to decode SVG-as-image when an XML declaration is present.
  svg = svg.replace(/^<\?xml[^?]*\?>\s*/, "");

  // Strip DOCTYPE (rare in modern SVG, but Verovio's older builds emit one).
  svg = svg.replace(/^<!DOCTYPE[^>]*>\s*/i, "");

  // Find the root <svg> element. If there isn't one, we can't normalise
  // and the caller will get the original error; not our place to invent.
  const rootMatch = /<svg\b([^>]*)>/i.exec(svg);
  if (!rootMatch) {
    return { svg, width: DEFAULT_W, height: DEFAULT_H };
  }
  const attrs = rootMatch[1];

  // Parse width / height / viewBox attributes.
  const widthAttr = /\bwidth\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];
  const heightAttr = /\bheight\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];
  const viewBoxAttr = /\bviewBox\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];

  // Parse viewBox into 4 numbers if present (default to 0 0 w h on fail).
  let vb: [number, number, number, number] | null = null;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      vb = [parts[0], parts[1], parts[2], parts[3]];
    }
  }

  // Derive numeric dims. Percentage values (e.g. width="100%") cannot be
  // rasterised standalone (there's no container to resolve them against),
  // so fall through to viewBox in that case.
  const numericWidth = parsePxValue(widthAttr);
  const numericHeight = parsePxValue(heightAttr);
  const width = numericWidth ?? (vb ? Math.ceil(vb[2]) : DEFAULT_W);
  const height = numericHeight ?? (vb ? Math.ceil(vb[3]) : DEFAULT_H);

  // Rebuild the attribute list: ensure xmlns + explicit width/height.
  let newAttrs = attrs;
  if (!/\bxmlns\s*=/i.test(newAttrs)) {
    newAttrs = ` ${SVG_XMLNS}${newAttrs}`;
  }
  // Replace or insert width.
  if (/\bwidth\s*=\s*"/i.test(newAttrs)) {
    newAttrs = newAttrs.replace(/\bwidth\s*=\s*"[^"]*"/i, `width="${width}"`);
  } else {
    newAttrs += ` width="${width}"`;
  }
  if (/\bheight\s*=\s*"/i.test(newAttrs)) {
    newAttrs = newAttrs.replace(/\bheight\s*=\s*"[^"]*"/i, `height="${height}"`);
  } else {
    newAttrs += ` height="${height}"`;
  }

  svg = svg.replace(rootMatch[0], `<svg${newAttrs}>`);

  return { svg, width, height };
}

function parsePxValue(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.endsWith("%")) return null;
  const m = /^([\d.]+)(?:px)?$/i.exec(trimmed);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) && n > 0 ? Math.ceil(n) : null;
}

/**
 * Rasterise an SVG string to a PNG Blob via `<img>` + canvas. Handles
 * the normalisation above transparently, so callers just pass whatever
 * the upstream renderer (Verovio, ABCJS, etc.) returned.
 *
 * Browser-only: requires DOM (`Image`, `URL.createObjectURL`, canvas).
 */
export async function svgToPngBlob(rawSvg: string): Promise<Blob> {
  const { svg, width, height } = normaliseSvgForRaster(rawSvg);

  // Use a data URL (base64) rather than blob URL. img.decode() is more
  // forgiving with data URLs across Safari + Firefox, and it avoids the
  // blob-URL revocation race that has been observed in some Chromium
  // builds when the converter cancels mid-render.
  const dataUrl =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(svg)));

  const img = new Image();
  img.src = dataUrl;
  try {
    await img.decode();
  } catch (err) {
    throw new Error(
      `Could not render the SVG into an image (${
        err instanceof Error ? err.message : String(err)
      }). The score may use SVG features your browser refuses to decode; try opening the file in a notation editor and re-exporting.`,
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/png",
    );
  });
}
