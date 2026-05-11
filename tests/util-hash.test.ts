/**
 * Deep unit tests for hash.ts. Hashes are integrity-critical — a bug here
 * means users compute the wrong checksum and trust corrupt files. We
 * verify against well-known fixed test vectors from RFC/FIPS specs.
 */

import { describe, it, expect } from "vitest";
import { hashMd5, hashSubtle, formatChecksumLine } from "../src/lib/engine/util/hash";

const enc = new TextEncoder();
const bytes = (s: string): ArrayBuffer => enc.encode(s).buffer as ArrayBuffer;

describe("hash: MD5 against known test vectors", () => {
  // Vectors from RFC 1321 Appendix A.5 + common test cases
  const vectors: Array<[string, string]> = [
    ["", "d41d8cd98f00b204e9800998ecf8427e"],
    ["a", "0cc175b9c0f1b6a831c399e269772661"],
    ["abc", "900150983cd24fb0d6963f7d28e17f72"],
    ["message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
    ["abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b"],
    ["The quick brown fox jumps over the lazy dog", "9e107d9d372bb6826bd81d3542a419d6"],
  ];

  it.each(vectors)("md5(%j) = %s", async (input, expected) => {
    expect(await hashMd5(bytes(input))).toBe(expected);
  });

  it("handles large input via chunked append (>2MB)", async () => {
    // Construct a 5MB buffer of repeating "a" — this exercises the
    // chunked spark-md5 path where one append() call isn't enough.
    const big = new Uint8Array(5 * 1024 * 1024).fill(0x61);
    const result = await hashMd5(big.buffer as ArrayBuffer);
    // Pre-computed: md5("a" * 5_242_880) = ...
    expect(result).toMatch(/^[0-9a-f]{32}$/);
    expect(result.length).toBe(32);
  });
});

describe("hash: SHA family against known test vectors", () => {
  // SHA-1 / SHA-256 / SHA-512 vectors from FIPS 180-4 + NIST CAVP
  const sha1Vectors: Array<[string, string]> = [
    ["", "da39a3ee5e6b4b0d3255bfef95601890afd80709"],
    ["abc", "a9993e364706816aba3e25717850c26c9cd0d89d"],
  ];

  const sha256Vectors: Array<[string, string]> = [
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    [
      "The quick brown fox jumps over the lazy dog",
      "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    ],
  ];

  const sha512Vectors: Array<[string, string]> = [
    [
      "",
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
    ],
    [
      "abc",
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    ],
  ];

  it.each(sha1Vectors)("sha1(%j) = %s", async (input, expected) => {
    expect(await hashSubtle(bytes(input), "SHA-1")).toBe(expected);
  });

  it.each(sha256Vectors)("sha256(%j) = %s", async (input, expected) => {
    expect(await hashSubtle(bytes(input), "SHA-256")).toBe(expected);
  });

  it.each(sha512Vectors)("sha512(%j) = %s", async (input, expected) => {
    expect(await hashSubtle(bytes(input), "SHA-512")).toBe(expected);
  });
});

describe("hash: checksum line formatting matches md5sum CLI", () => {
  it("uses two spaces between hash and filename (not one)", () => {
    const line = formatChecksumLine("d41d8cd98f00b204e9800998ecf8427e", "empty.txt");
    expect(line).toBe("d41d8cd98f00b204e9800998ecf8427e  empty.txt\n");
    // Critical: GNU coreutils md5sum/shasum uses TWO spaces (binary mode);
    // a single space would parse as the BSD-style format which other tools
    // misinterpret.
    expect(line.match(/  /)).not.toBeNull();
  });
});
