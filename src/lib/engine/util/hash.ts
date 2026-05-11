/**
 * File-hashing helpers. SHA-1/256/512 use the browser-native SubtleCrypto;
 * MD5 falls back to spark-md5 because SubtleCrypto deliberately omits MD5
 * (cryptographically broken — kept around purely for integrity-checking
 * legacy systems like older package registries and some CDN URLs).
 *
 * All return lowercase hex, matching `md5sum`/`shasum` CLI output so users
 * can diff our output against their terminal results.
 */

export type SubtleAlgo = "SHA-1" | "SHA-256" | "SHA-512";

export async function hashSubtle(buffer: ArrayBuffer, algo: SubtleAlgo): Promise<string> {
  const digest = await crypto.subtle.digest(algo, buffer);
  return bufferToHex(digest);
}

export async function hashMd5(buffer: ArrayBuffer): Promise<string> {
  const SparkMd5 = (await import("spark-md5")).default;
  const spark = new SparkMd5.ArrayBuffer();
  // Chunk to keep memory bounded on big files (~2MB chunks)
  const CHUNK = 2 * 1024 * 1024;
  const total = buffer.byteLength;
  for (let off = 0; off < total; off += CHUNK) {
    spark.append(buffer.slice(off, Math.min(off + CHUNK, total)));
  }
  return spark.end();
}

function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/** Format like `md5sum`: `<hex>  <filename>\n` (two spaces). */
export function formatChecksumLine(hex: string, filename: string): string {
  return `${hex}  ${filename}\n`;
}
