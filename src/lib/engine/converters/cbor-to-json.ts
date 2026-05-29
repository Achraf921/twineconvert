import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * CBOR → JSON. CBOR (RFC 8949) is the IETF-standard binary JSON; it
 * powers COSE, WebAuthn attestation, and most IoT protocols on the
 * recent COAP/LwM2M stack. Output is pretty-printed JSON; embedded
 * byte strings are emitted as base64 (matching cbor-cli's default).
 */
const cborToJson: Converter = {
  id: "cbor-to-json",
  label: "CBOR → JSON",
  fromMime: ["application/cbor", "application/octet-stream"],
  accept: [".cbor", ".bin"],
  toMime: "application/json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const { decode } = await import("cbor-x");
      const bytes = new Uint8Array(await input.arrayBuffer());
      const value = decode(bytes);
      json = JSON.stringify(value, binaryReplacer, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not decode CBOR",
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

function binaryReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return { $binary: btoa(String.fromCharCode(...value)) };
  }
  return value;
}

export default cborToJson;
