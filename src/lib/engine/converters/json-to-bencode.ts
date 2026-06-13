import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseJsonInput } from "../util/parse-json-input";

/**
 * JSON → Bencode. Encodes the input document into the BitTorrent .torrent
 * bencode binary format. Strings encode as bytestrings; if a string
 * value uses the { "$binary": "<base64>" } shape (the convention our
 * decoder uses for non-printable byte fields like SHA1 pieces hashes)
 * we decode the base64 and emit the raw bytes so the result round-trips
 * cleanly.
 */
const jsonToBencode: Converter = {
  id: "json-to-bencode",
  label: "JSON → Bencode",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/x-bittorrent",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const bencode = await import("bencode");
      const encode = (bencode.default ?? bencode).encode as (
        v: unknown,
      ) => Uint8Array | Buffer;
      const parsed: unknown = parseJsonInput(await input.text());
      const restored = restoreBinaries(parsed);
      const out = encode(restored);
      const ab = new ArrayBuffer(out.length);
      new Uint8Array(ab).set(out);
      blob = new Blob([ab], { type: "application/x-bittorrent" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not encode JSON as bencode",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob,
      filename: swapExtension(input.name, "torrent"),
    };
  },
};

function restoreBinaries(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(restoreBinaries);
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (
      Object.keys(obj).length === 1 &&
      typeof obj.$binary === "string"
    ) {
      const bin = atob(obj.$binary);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) out[k] = restoreBinaries(obj[k]);
    return out;
  }
  return input;
}

export default jsonToBencode;
