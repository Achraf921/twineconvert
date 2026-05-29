import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON → CBOR (RFC 8949). Encodes the input document to compact
 * binary. CBOR is the encoding behind COSE / WebAuthn attestation
 * and the IoT stack; emitting it from a JSON source is the common
 * dev workflow when integrating against a CBOR endpoint.
 */
const jsonToCbor: Converter = {
  id: "json-to-cbor",
  label: "JSON → CBOR",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/cbor",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const { encode } = await import("cbor-x");
      const parsed: unknown = JSON.parse(await input.text());
      const out = encode(parsed);
      const ab = new ArrayBuffer(out.length);
      new Uint8Array(ab).set(out);
      blob = new Blob([ab], { type: "application/cbor" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not encode JSON as CBOR",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob,
      filename: swapExtension(input.name, "cbor"),
    };
  },
};

export default jsonToCbor;
