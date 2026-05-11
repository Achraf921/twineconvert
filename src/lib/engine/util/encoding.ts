/**
 * Encoding helpers used by base64/url/hex converters.
 *
 * All operate on bytes — strings are UTF-8 encoded/decoded at the boundary so
 * non-ASCII content (emoji, accents, CJK) survives intact. The browser-native
 * `btoa`/`atob` only handle Latin-1 byte ranges, which is why we route through
 * `TextEncoder`/`TextDecoder` and operate on Uint8Array directly.
 */

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { fatal: true });

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  // Chunk to keep `String.fromCharCode.apply` under JS engine arg limits
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  // Tolerate stray whitespace/line breaks that get added when base64 is
  // wrapped at 76 cols (MIME-style) or pasted from a code block
  const cleaned = b64.replace(/\s+/g, "");
  const bin = atob(cleaned);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const textToBase64 = (text: string) => bytesToBase64(enc.encode(text));
export const base64ToText = (b64: string) => dec.decode(base64ToBytes(b64));

export const textToUrlEncoded = (text: string) => encodeURIComponent(text);
export const urlEncodedToText = (text: string) => decodeURIComponent(text);

export function textToHex(text: string): string {
  const bytes = enc.encode(text);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export function hexToText(hex: string): string {
  const cleaned = hex.replace(/\s+/g, "").replace(/^0x/i, "");
  if (cleaned.length % 2 !== 0) {
    throw new Error("Hex input length must be even");
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error("Hex input contains non-hex characters");
  }
  const out = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return dec.decode(out);
}
