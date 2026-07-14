/**
 * Font format conversion via fonteditor-core. The library reads + writes
 * TTF, OTF (CFF), WOFF, and EOT through a common SFNT-table model — once
 * we parse into the model, re-emitting in any target format is a single
 * `font.write({ type })` call.
 *
 * WOFF2 is intentionally NOT supported here: it uses Brotli compression
 * with format-specific preprocessing (font-specific Brotli dictionaries),
 * which fonteditor-core doesn't ship. wawoff2 would handle it but pulls
 * in 1MB+ of WASM — not worth it until we see real WOFF2 demand.
 *
 * What survives: glyph outlines, metrics, kerning, OS/2 table data.
 * What doesn't: very recent OpenType features (variable fonts axes,
 * COLRv1 glyphs) may be partial.
 */

export type FontFormat = "ttf" | "otf" | "woff" | "eot";

/**
 * Identify a font container by magic bytes. Users routinely upload fonts
 * with the wrong extension (a TTF renamed to .woff, a WOFF2 saved as .woff
 * by a webfont service), and the parser errors for those are opaque
 * ("woff file damaged", observed in production). Sniffing lets us parse
 * with the RIGHT type, or fail with an actionable message for WOFF2.
 */
export function sniffFontFormat(input: ArrayBuffer): FontFormat | "woff2" | null {
  if (input.byteLength < 4) return null;
  const magic = new DataView(input).getUint32(0, false);
  switch (magic) {
    case 0x774f4646: return "woff"; // 'wOFF'
    case 0x774f4632: return "woff2"; // 'wOF2'
    case 0x00010000: return "ttf"; // TrueType sfnt
    case 0x74727565: return "ttf"; // 'true' (legacy Apple TrueType)
    case 0x4f54544f: return "otf"; // 'OTTO' (CFF OpenType)
    default: return null;
  }
}

export async function convertFont(
  input: ArrayBuffer,
  fromType: FontFormat,
  toType: FontFormat,
): Promise<ArrayBuffer> {
  // Trust the bytes over the file extension (EOT has no reliable magic, so
  // a null sniff falls back to the extension-derived type).
  const sniffed = sniffFontFormat(input);
  if (sniffed === "woff2") {
    throw new Error(
      "This file is WOFF2, not WOFF (its bytes start with wOF2). WOFF2 uses Brotli compression this tool cannot decode yet. Decompress it first with a WOFF2 tool such as Google's woff2_decompress, then convert the resulting TTF here.",
    );
  }
  const actualType = sniffed ?? fromType;

  // fonteditor-core uses CommonJS-style namespace exports; the default
  // import path differs between ESM and CJS bundlers. Pull the named
  // Font export directly to avoid a brittle `.default` chain.
  const { Font } = await import("fonteditor-core");
  const font = Font.create(input, { type: actualType, hinting: true });
  const out = font.write({ type: toType, hinting: true });
  if (typeof out === "string") {
    // EOT and some legacy outputs come back as binary-string; convert.
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes.buffer;
  }
  return out as ArrayBuffer;
}
