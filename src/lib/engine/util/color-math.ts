/**
 * Pure color-space math. No DOM, no libraries. Used by every
 * `<X>-to-<Y>` color converter in src/lib/engine/converters/.
 *
 * All functions take and return numbers in their natural ranges:
 *   RGB: 0-255 per channel
 *   HSL: H 0-360 degrees, S/L 0-100 percent
 *   CMYK: 0-100 percent per channel
 *
 * Hex strings are 6-char (no alpha) with leading `#`. The `#` is
 * required on parse and added on serialize.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}
export interface HSL {
  h: number;
  s: number;
  l: number;
}
export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export function hexToRgb(hex: string): RGB {
  const cleaned = hex.trim().replace(/^#/, "");
  let h = cleaned;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`.toUpperCase();
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

// ---- Parse / serialize text formats with one value per line --------

/** Parse a text file with one hex code per line, ignoring blank lines and `;`/`#` comments. */
export function parseHexLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith(";"))
    // Allow `#FF0000 ; name` inline comment style used by buildHexList()
    .map((l) => l.split(/\s+/)[0])
    .filter((l) => l.startsWith("#") && l.length >= 4);
}

/** Parse `rgb(r, g, b)` or `r, g, b` lines (parens + commas optional). */
export function parseRgbLines(text: string): RGB[] {
  const out: RGB[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) continue;
    out.push({
      r: parseInt(m[1], 10),
      g: parseInt(m[2], 10),
      b: parseInt(m[3], 10),
    });
  }
  return out;
}

/** Parse `hsl(h, s%, l%)` or `h, s, l` lines. */
export function parseHslLines(text: string): HSL[] {
  const out: HSL[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (!m) continue;
    out.push({
      h: parseInt(m[1], 10),
      s: parseInt(m[2], 10),
      l: parseInt(m[3], 10),
    });
  }
  return out;
}

/** Parse `cmyk(c%, m%, y%, k%)` or `c, m, y, k` lines. */
export function parseCmykLines(text: string): CMYK[] {
  const out: CMYK[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (!m) continue;
    out.push({
      c: parseInt(m[1], 10),
      m: parseInt(m[2], 10),
      y: parseInt(m[3], 10),
      k: parseInt(m[4], 10),
    });
  }
  return out;
}

export const formatRgb = (rgb: RGB) => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
export const formatHsl = (hsl: HSL) => `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
export const formatCmyk = (cmyk: CMYK) => `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
