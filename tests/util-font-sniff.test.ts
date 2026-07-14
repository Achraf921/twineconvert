/**
 * Font container sniffing + the WOFF2 guard.
 *
 * Production (PostHog): woff-to-ttf failed 29x/wk with opaque parser errors
 * ("woff file damaged" and fonteditor-core's untranslated Chinese message).
 * The dominant real-world cause is a mislabeled container: WOFF2 saved as
 * .woff by webfont services, or a plain TTF renamed. sniffFontFormat reads
 * the magic bytes so convertFont parses with the actual type and rejects
 * WOFF2 with an actionable message instead of a parser stack trace.
 */
import { describe, expect, it } from "vitest";
import { convertFont, sniffFontFormat } from "../src/lib/engine/util/font";

function bufFromMagic(magic: number[], pad = 60): ArrayBuffer {
  const bytes = new Uint8Array(magic.length + pad);
  bytes.set(magic, 0);
  return bytes.buffer;
}

describe("sniffFontFormat", () => {
  it("identifies WOFF by wOFF magic", () => {
    expect(sniffFontFormat(bufFromMagic([0x77, 0x4f, 0x46, 0x46]))).toBe("woff");
  });
  it("identifies WOFF2 by wOF2 magic", () => {
    expect(sniffFontFormat(bufFromMagic([0x77, 0x4f, 0x46, 0x32]))).toBe("woff2");
  });
  it("identifies TrueType by sfnt version 1.0", () => {
    expect(sniffFontFormat(bufFromMagic([0x00, 0x01, 0x00, 0x00]))).toBe("ttf");
  });
  it("identifies legacy Apple TrueType by 'true'", () => {
    expect(sniffFontFormat(bufFromMagic([0x74, 0x72, 0x75, 0x65]))).toBe("ttf");
  });
  it("identifies CFF OpenType by OTTO", () => {
    expect(sniffFontFormat(bufFromMagic([0x4f, 0x54, 0x54, 0x4f]))).toBe("otf");
  });
  it("returns null for unknown bytes and tiny buffers", () => {
    expect(sniffFontFormat(bufFromMagic([0xde, 0xad, 0xbe, 0xef]))).toBeNull();
    expect(sniffFontFormat(new Uint8Array([0x77]).buffer)).toBeNull();
  });
});

describe("convertFont WOFF2 guard", () => {
  it("rejects a WOFF2 file uploaded as .woff with an actionable message", async () => {
    const woff2 = bufFromMagic([0x77, 0x4f, 0x46, 0x32], 200);
    await expect(convertFont(woff2, "woff", "ttf")).rejects.toThrow(/WOFF2/);
    await expect(convertFont(woff2, "woff", "ttf")).rejects.toThrow(/woff2_decompress/);
  });
});
