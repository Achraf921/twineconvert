/**
 * Deep unit tests for color-math.ts. Color converters are downstream of
 * these — a bug in `hexToRgb` cascades into 10 broken tools. We test:
 *   - exact known values (HEX literals → RGB tuples)
 *   - bijection at full RGB precision (hex round-trip = identity)
 *   - HSL/CMYK approximate round-trip with bounded error
 *   - parser tolerance (CSS-style lines, spaces, percent signs)
 *   - input validation (malformed hex throws specifically)
 */

import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToCmyk,
  cmykToRgb,
  parseHexLines,
  parseRgbLines,
  parseHslLines,
  parseCmykLines,
  formatRgb,
  formatHsl,
  formatCmyk,
} from "../src/lib/engine/util/color-math";

describe("color-math: HEX ↔ RGB exact bijection", () => {
  const knownPairs: Array<[string, { r: number; g: number; b: number }]> = [
    ["#FF0000", { r: 255, g: 0, b: 0 }],
    ["#00FF00", { r: 0, g: 255, b: 0 }],
    ["#0000FF", { r: 0, g: 0, b: 255 }],
    ["#FFFFFF", { r: 255, g: 255, b: 255 }],
    ["#000000", { r: 0, g: 0, b: 0 }],
    ["#808080", { r: 128, g: 128, b: 128 }],
    ["#FF6347", { r: 255, g: 99, b: 71 }], // tomato
    ["#4169E1", { r: 65, g: 105, b: 225 }], // royalblue
  ];

  it.each(knownPairs)("hexToRgb(%s) returns the expected RGB tuple", (hex, rgb) => {
    expect(hexToRgb(hex)).toEqual(rgb);
  });

  it.each(knownPairs)("rgbToHex(rgb) returns %s for the corresponding RGB", (hex, rgb) => {
    expect(rgbToHex(rgb)).toBe(hex);
  });

  it("round-trips every value in the 8-bit primary axis without drift", () => {
    // Sample RGB values across the full [0, 255] range; round-trip must
    // be the identity function for HEX → RGB → HEX (hex is exactly 8-bit
    // RGB, no precision loss possible).
    for (let r = 0; r <= 255; r += 17) {
      for (let g = 0; g <= 255; g += 17) {
        for (let b = 0; b <= 255; b += 17) {
          const original = { r, g, b };
          const back = hexToRgb(rgbToHex(original));
          expect(back).toEqual(original);
        }
      }
    }
  });

  it("supports 3-char hex shorthand (#FFF → #FFFFFF)", () => {
    expect(hexToRgb("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#F00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#abc")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("is case-insensitive on input", () => {
    expect(hexToRgb("#ff0000")).toEqual(hexToRgb("#FF0000"));
    expect(hexToRgb("#aAbBcC")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("emits uppercase hex with leading #", () => {
    expect(rgbToHex({ r: 255, g: 99, b: 71 })).toBe("#FF6347");
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
  });

  it("clamps out-of-range RGB values rather than throwing", () => {
    // Math operations can produce slight overshoot; the encoder should
    // tolerate it rather than blowing up at the boundary.
    expect(rgbToHex({ r: 256, g: -1, b: 300 })).toBe("#FF00FF");
  });

  it("throws ConvertFailedError-style errors on malformed hex", () => {
    expect(() => hexToRgb("not-a-hex")).toThrow(/Invalid hex/);
    expect(() => hexToRgb("#GG0000")).toThrow(/Invalid hex/);
    expect(() => hexToRgb("#1234")).toThrow(/Invalid hex/); // 4 chars not supported
  });
});

describe("color-math: HSL round-trip preserves perceptual primaries", () => {
  // HSL has fewer discrete states than HEX (~3.7M vs 16.7M) so general
  // round-trip is lossy. But the corner colors (full saturation primaries
  // and grayscale) sit at HSL boundaries and must round-trip exactly.
  const corners = [
    { r: 255, g: 0, b: 0 }, // red
    { r: 0, g: 255, b: 0 }, // green
    { r: 0, g: 0, b: 255 }, // blue
    { r: 255, g: 255, b: 0 }, // yellow
    { r: 0, g: 255, b: 255 }, // cyan
    { r: 255, g: 0, b: 255 }, // magenta
    { r: 0, g: 0, b: 0 }, // black
    { r: 255, g: 255, b: 255 }, // white
  ];

  it.each(corners)("RGB(%j) → HSL → RGB round-trips exactly", (rgb) => {
    expect(hslToRgb(rgbToHsl(rgb))).toEqual(rgb);
  });

  it("non-corner RGB values round-trip within ±3 per channel (double-rounding bound)", () => {
    // RGB → HSL rounds H/S/L to integers; HSL → RGB then rounds again.
    // The compound error is bounded by ~3/255 (~1.2%) per channel; anything
    // larger means our rounding is wrong, anything tighter is luck.
    const samples = [
      { r: 100, g: 150, b: 200 },
      { r: 73, g: 218, b: 55 },
      { r: 200, g: 50, b: 75 },
    ];
    for (const rgb of samples) {
      const back = hslToRgb(rgbToHsl(rgb));
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(3);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(3);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(3);
    }
  });

  it("known HSL → RGB conversions match CSS spec", () => {
    // CSS Level 4 spec values
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
    // 0% saturation = grayscale, hue irrelevant
    expect(hslToRgb({ h: 999, s: 0, l: 50 })).toEqual({ r: 128, g: 128, b: 128 });
  });

  it("rgbToHsl returns 0 saturation for grayscale", () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
    expect(rgbToHsl({ r: 0, g: 0, b: 0 }).s).toBe(0);
    expect(rgbToHsl({ r: 255, g: 255, b: 255 }).s).toBe(0);
  });
});

describe("color-math: CMYK round-trip preserves primaries", () => {
  it("pure black is K=100 with all other channels zero", () => {
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });

  it("pure white is all zeros", () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });

  it("round-trips RGB primaries within ±3 per channel", () => {
    const primaries = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
    ];
    for (const rgb of primaries) {
      const back = cmykToRgb(rgbToCmyk(rgb));
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(3);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(3);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(3);
    }
  });
});

describe("color-math: parsers accept multiple formatting styles", () => {
  it("parseHexLines tolerates trailing comments and blank lines", () => {
    const input = `#FF0000 ; red
#00FF00 ; green

; this is a comment line
#0000FF
`;
    expect(parseHexLines(input)).toEqual(["#FF0000", "#00FF00", "#0000FF"]);
  });

  it("parseRgbLines accepts both rgb(...) and bare comma forms", () => {
    const input = `rgb(255, 0, 0)
0, 255, 0
rgb(0,0,255)
`;
    expect(parseRgbLines(input)).toEqual([
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
    ]);
  });

  it("parseHslLines accepts percent-signed and bare numeric saturation/lightness", () => {
    const input = `hsl(0, 100%, 50%)
hsl(120, 100, 50)
240, 100%, 50%
`;
    expect(parseHslLines(input)).toEqual([
      { h: 0, s: 100, l: 50 },
      { h: 120, s: 100, l: 50 },
      { h: 240, s: 100, l: 50 },
    ]);
  });

  it("parseCmykLines accepts percent-signed and bare values", () => {
    const input = `cmyk(0%, 100%, 100%, 0%)
0, 0, 0, 100
`;
    expect(parseCmykLines(input)).toEqual([
      { c: 0, m: 100, y: 100, k: 0 },
      { c: 0, m: 0, y: 0, k: 100 },
    ]);
  });

  it("formatters round-trip with parsers (parser ∘ formatter = identity)", () => {
    const rgb = { r: 100, g: 150, b: 200 };
    expect(parseRgbLines(formatRgb(rgb))).toEqual([rgb]);

    const hsl = { h: 200, s: 50, l: 70 };
    expect(parseHslLines(formatHsl(hsl))).toEqual([hsl]);

    const cmyk = { c: 25, m: 50, y: 75, k: 10 };
    expect(parseCmykLines(formatCmyk(cmyk))).toEqual([cmyk]);
  });

  it("returns empty array for empty / whitespace-only input", () => {
    expect(parseHexLines("")).toEqual([]);
    expect(parseRgbLines("\n\n\n")).toEqual([]);
    expect(parseHslLines("   ")).toEqual([]);
    expect(parseCmykLines("")).toEqual([]);
  });
});
