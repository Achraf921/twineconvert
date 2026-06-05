/**
 * SVG rasteriser normalisation tests. These are the failure modes that
 * triggered the production "Invalid encoded image data" PostHog event
 * on musicxml-to-pdf, encoded as unit tests so a regression fails CI
 * before a user ever sees it.
 */

import { describe, it, expect } from "vitest";
import { normaliseSvgForRaster } from "../src/lib/engine/util/svg-raster";

describe("normaliseSvgForRaster", () => {
  it("strips a leading XML processing instruction", () => {
    const input = `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="100" height="50"><g/></svg>`;
    const out = normaliseSvgForRaster(input);
    expect(out.svg).not.toMatch(/^<\?xml/);
    expect(out.svg.startsWith("<svg")).toBe(true);
    expect(out.width).toBe(100);
    expect(out.height).toBe(50);
  });

  it("strips a leading BOM", () => {
    const input = `﻿<svg width="50" height="50"></svg>`;
    const out = normaliseSvgForRaster(input);
    expect(out.svg.charCodeAt(0)).not.toBe(0xfeff);
    expect(out.svg.startsWith("<svg")).toBe(true);
  });

  it("strips a leading DOCTYPE", () => {
    const input = `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x.dtd">\n<svg width="100" height="100"/>`;
    const out = normaliseSvgForRaster(input);
    expect(out.svg).not.toMatch(/<!DOCTYPE/i);
  });

  it("injects xmlns when the root <svg> is missing it", () => {
    const input = `<svg width="100" height="50"><g/></svg>`;
    const out = normaliseSvgForRaster(input);
    expect(out.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("does NOT double-inject xmlns when it is already present", () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"/>`;
    const out = normaliseSvgForRaster(input);
    const matches = out.svg.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("derives width/height from viewBox when explicit attrs missing", () => {
    const input = `<svg viewBox="0 0 800 1200"><g/></svg>`;
    const out = normaliseSvgForRaster(input);
    expect(out.width).toBe(800);
    expect(out.height).toBe(1200);
    expect(out.svg).toMatch(/\bwidth="800"/);
    expect(out.svg).toMatch(/\bheight="1200"/);
  });

  it("derives width/height from viewBox when explicit attrs are percentages", () => {
    const input = `<svg width="100%" height="100%" viewBox="0 0 400 600"><g/></svg>`;
    const out = normaliseSvgForRaster(input);
    expect(out.width).toBe(400);
    expect(out.height).toBe(600);
    // Percentage attrs replaced with explicit pixel values.
    expect(out.svg).toMatch(/\bwidth="400"/);
    expect(out.svg).toMatch(/\bheight="600"/);
    expect(out.svg).not.toMatch(/width="100%"/);
  });

  it("strips a 'px' suffix in explicit width/height", () => {
    const input = `<svg width="123px" height="456px"/>`;
    const out = normaliseSvgForRaster(input);
    expect(out.width).toBe(123);
    expect(out.height).toBe(456);
  });

  it("rounds fractional dimensions up", () => {
    const input = `<svg viewBox="0 0 100.4 200.9"/>`;
    const out = normaliseSvgForRaster(input);
    expect(out.width).toBe(101);
    expect(out.height).toBe(201);
  });

  it("falls back to A4-ish defaults when neither attrs nor viewBox parse", () => {
    const input = `<svg><g/></svg>`;
    const out = normaliseSvgForRaster(input);
    // Just assert sensible non-zero positive dimensions; the exact defaults
    // are implementation detail we don't want to lock down.
    expect(out.width).toBeGreaterThan(100);
    expect(out.height).toBeGreaterThan(100);
  });

  it("handles all four failure modes at once (the PostHog repro shape)", () => {
    // Verovio-flavoured: XML decl + missing xmlns + viewBox-only sizing.
    const input = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 1000 1500"><g class="staff"><path d="M0,0 L100,0"/></g></svg>`;
    const out = normaliseSvgForRaster(input);
    expect(out.svg).not.toMatch(/^<\?xml/);
    expect(out.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out.svg).toMatch(/\bwidth="1000"/);
    expect(out.svg).toMatch(/\bheight="1500"/);
    expect(out.width).toBe(1000);
    expect(out.height).toBe(1500);
    // Inner content preserved.
    expect(out.svg).toContain('class="staff"');
    expect(out.svg).toContain("M0,0 L100,0");
  });

  it("returns input unchanged when there is no <svg> root", () => {
    const input = `<not-an-svg>oops</not-an-svg>`;
    const out = normaliseSvgForRaster(input);
    expect(out.svg).toBe(input);
  });
});
