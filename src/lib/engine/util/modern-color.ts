/**
 * Modern color-space conversions via culori. OKLCH and LAB live in CSS
 * Color Module Level 4 — they describe color in perceptually-uniform
 * coordinates so that "lighter by 10%" actually looks 10% lighter to a
 * human eye (RGB/HSL doesn't behave that way at all).
 *
 * Tailwind v4, Adobe, Apple, Sketch, and Figma are all migrating to
 * OKLCH-based palettes because design-system math (generate a tonal
 * scale, find the contrast pair, etc.) becomes trivial in OKLCH and
 * impossible-without-LUTs in HSL.
 */

import {
  parse,
  formatHex,
  formatCss,
  converter,
  type Color,
  type Oklch,
  type Lab,
} from "culori";

// Build proper color-space converters once. `converter("oklch")(c)`
// transforms `c` into the OKLCH color space (calling the matrix
// chain srgb → linear-srgb → xyz → oklab → oklch under the hood).
// Spreading `mode: "oklch"` onto an RGB object would just relabel
// the channels — which is the bug we hit shipping this initially.
const toOklchModel = converter("oklch");
const toLabModel = converter("lab");

/** Parse any CSS-compatible color string into culori's internal model. */
export function parseColor(s: string): Color {
  const c = parse(s.trim());
  if (!c) throw new Error(`Invalid color: "${s}"`);
  return c;
}

/** Format a culori color as a #RRGGBB hex string (uppercase). */
export function toHex(c: Color): string {
  // culori returns null for unrepresentable colors (out-of-gamut after
  // certain conversions). Fall back to black so we always emit something
  // valid; the caller's user gets a recognizable "broken" result rather
  // than a thrown error.
  return formatHex(c)?.toUpperCase() ?? "#000000";
}

/** Format an OKLCH color in CSS Color Level 4 syntax: `oklch(L% C h)`. */
export function toOklch(c: Color): string {
  return formatCss(toOklchModel(c)) ?? "oklch(0% 0 0)";
}

/** Format a Lab color in CSS Color Level 4 syntax: `lab(L% a b)`. */
export function toLab(c: Color): string {
  return formatCss(toLabModel(c)) ?? "lab(0% 0 0)";
}

/** Parse `oklch(L% C h)` from a text line. Tolerant of `oklch(L C h)`
 *  with bare L (0..1) per spec extension. */
export function parseOklch(line: string): Oklch | null {
  const c = parse(line.trim());
  return c && c.mode === "oklch" ? (c as Oklch) : null;
}

export function parseLab(line: string): Lab | null {
  const c = parse(line.trim());
  return c && c.mode === "lab" ? (c as Lab) : null;
}

/** Split text input into lines, dropping empties + comments. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith(";") && !l.startsWith("#") || l.startsWith("#"));
}
