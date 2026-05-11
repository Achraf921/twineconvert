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

export async function convertFont(
  input: ArrayBuffer,
  fromType: FontFormat,
  toType: FontFormat,
): Promise<ArrayBuffer> {
  // fonteditor-core uses CommonJS-style namespace exports; the default
  // import path differs between ESM and CJS bundlers. Pull the named
  // Font export directly to avoid a brittle `.default` chain.
  const { Font } = await import("fonteditor-core");
  const font = Font.create(input, { type: fromType, hinting: true });
  const out = font.write({ type: toType, hinting: true });
  if (typeof out === "string") {
    // EOT and some legacy outputs come back as binary-string; convert.
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes.buffer;
  }
  return out as ArrayBuffer;
}
