import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * MessagePack → JSON. MessagePack is a compact binary JSON-equivalent
 * (used by Redis, Aerospike, lots of game / IoT protocols). Output is
 * pretty-printed JSON; binary blobs inside the document are emitted
 * as base64 strings (the convention msgpack-cli uses).
 */
const msgpackToJson: Converter = {
  id: "msgpack-to-json",
  label: "MessagePack → JSON",
  fromMime: ["application/msgpack", "application/x-msgpack", "application/octet-stream"],
  accept: [".msgpack", ".mp", ".bin"],
  toMime: "application/json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const { decode } = await import("@msgpack/msgpack");
      const bytes = new Uint8Array(await input.arrayBuffer());
      const value = decode(bytes);
      json = JSON.stringify(value, binaryReplacer, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not decode MessagePack",
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

export default msgpackToJson;
