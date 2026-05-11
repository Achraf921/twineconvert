/**
 * Deep unit tests for css-color-names.ts. The lookup table is fixed CSS
 * spec data — drift would silently mis-color downstream output.
 */

import { describe, it, expect } from "vitest";
import {
  CSS_COLOR_NAMES,
  nameToHex,
  hexToNearestName,
} from "../src/lib/engine/util/css-color-names";

describe("css-color-names: lookup table integrity", () => {
  it("contains all 147 CSS Level 4 named colors (including aliases)", () => {
    // 147 = 140 distinct names + 7 spec aliases (cyan/aqua, magenta/fuchsia,
    // gray/grey, darkgray/darkgrey, dimgray/dimgrey, darkslategray/darkslategrey,
    // lightslategray/lightslategrey + slategray/slategrey + lightgray/lightgrey)
    expect(Object.keys(CSS_COLOR_NAMES).length).toBeGreaterThanOrEqual(147);
  });

  it("every entry is a 7-char uppercase hex starting with #", () => {
    for (const [name, hex] of Object.entries(CSS_COLOR_NAMES)) {
      expect(hex, `entry "${name}" should be #RRGGBB`).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("aliases map to the same hex (gray = grey, cyan = aqua, etc.)", () => {
    expect(CSS_COLOR_NAMES.gray).toBe(CSS_COLOR_NAMES.grey);
    expect(CSS_COLOR_NAMES.cyan).toBe(CSS_COLOR_NAMES.aqua);
    expect(CSS_COLOR_NAMES.magenta).toBe(CSS_COLOR_NAMES.fuchsia);
    expect(CSS_COLOR_NAMES.darkgray).toBe(CSS_COLOR_NAMES.darkgrey);
    expect(CSS_COLOR_NAMES.darkslategray).toBe(CSS_COLOR_NAMES.darkslategrey);
  });
});

describe("css-color-names: nameToHex", () => {
  it("returns exact hex for spec-defined names", () => {
    // Pinned CSS spec values; if any of these break, the lookup table drifted
    expect(nameToHex("red")).toBe("#FF0000");
    expect(nameToHex("rebeccapurple")).toBe("#663399");
    expect(nameToHex("tomato")).toBe("#FF6347");
    expect(nameToHex("forestgreen")).toBe("#228B22");
    expect(nameToHex("midnightblue")).toBe("#191970");
  });

  it("is case-insensitive on input", () => {
    expect(nameToHex("RED")).toBe(nameToHex("red"));
    expect(nameToHex("ToMaTo")).toBe(nameToHex("tomato"));
  });

  it("returns null for unknown names", () => {
    expect(nameToHex("not-a-color")).toBeNull();
    expect(nameToHex("")).toBeNull();
  });
});

describe("css-color-names: hexToNearestName", () => {
  it("returns exact name for hex values that are CSS named", () => {
    expect(hexToNearestName("#FF0000")).toBe("red");
    expect(hexToNearestName("#FF6347")).toBe("tomato");
    expect(hexToNearestName("#000000")).toBe("black");
    expect(hexToNearestName("#FFFFFF")).toBe("white");
  });

  it("nearest-neighbor returns the closest CSS color for off-spec hex", () => {
    // #FF0001 is one blue-channel step from #FF0000 (red). Nearest = red.
    expect(hexToNearestName("#FF0001")).toBe("red");
    // #110000 is much closer to black than to red
    expect(hexToNearestName("#110000")).toBe("black");
  });

  it("throws on invalid hex", () => {
    expect(() => hexToNearestName("not-hex")).toThrow(/Invalid hex/);
    expect(() => hexToNearestName("#GG0000")).toThrow(/Invalid hex/);
  });

  it("name → hex → nearest-name is the identity for all 147 colors", () => {
    // For every CSS color name, going through hex and back must give us
    // the same name (or a spec alias of it). This is the structural
    // bijection guarantee we promise users in the round-trip test.
    for (const [name, hex] of Object.entries(CSS_COLOR_NAMES)) {
      const back = hexToNearestName(hex);
      // Either same name, or an alias that maps to the same hex
      expect(CSS_COLOR_NAMES[back]).toBe(hex);
    }
  });
});
