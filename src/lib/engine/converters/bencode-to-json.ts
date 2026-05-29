import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Bencode → JSON. Bencode is the binary-ish dictionary format used by
 * .torrent files (and the BEP wire protocol). Decoding it gives you
 * the announce URL, comment, info dictionary (name, piece length,
 * pieces hash, files), and any custom keys the torrent was published
 * with. Output is pretty-printed JSON; bytes-typed values (like the
 * pieces SHA1 hash blob) are emitted as base64 to keep the output
 * round-trippable.
 */
const bencodeToJson: Converter = {
  id: "bencode-to-json",
  label: "Bencode → JSON",
  fromMime: ["application/x-bittorrent", "application/octet-stream"],
  accept: [".torrent", ".bencode", ".bin"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const bencode = await import("bencode");
      const decode = (bencode.default ?? bencode).decode as (
        b: Uint8Array | Buffer,
      ) => unknown;
      const bytes = new Uint8Array(await input.arrayBuffer());
      const decoded = decode(bytes);
      json = JSON.stringify(decoded, bytesReplacer, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not decode bencode",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

function bytesReplacer(_key: string, value: unknown): unknown {
  // bencode returns Buffer/Uint8Array for byte strings. Try to decode
  // as UTF-8 first (almost everything inside a .torrent is human-readable
  // except `pieces` and similar SHA1 blobs); fall back to base64.
  if (value instanceof Uint8Array || (value as { type?: string })?.type === "Buffer") {
    const bytes =
      value instanceof Uint8Array
        ? value
        : new Uint8Array((value as { data: number[] }).data);
    const text = new TextDecoder("utf-8", { fatal: true });
    try {
      const decoded = text.decode(bytes);
      // Reject the decode if it contains control characters not normally
      // present in human-readable values; that's the signal that this
      // field is actually a binary hash.
      if (!/[\x00-\x08\x0b-\x1f]/.test(decoded)) return decoded;
    } catch {
      // fall through to base64
    }
    return { $binary: btoa(String.fromCharCode(...bytes)) };
  }
  return value;
}

export default bencodeToJson;
