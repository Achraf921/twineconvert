import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseJsonInput } from "../util/parse-json-input";

/**
 * JSON → MessagePack. Encodes the input document to compact binary.
 * Typical size win is 20–40 percent vs the same JSON; the gap widens
 * when the input has lots of numbers (msgpack uses native int types
 * instead of decimal strings).
 */
const jsonToMsgpack: Converter = {
  id: "json-to-msgpack",
  label: "JSON → MessagePack",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/msgpack",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const { encode } = await import("@msgpack/msgpack");
      const parsed: unknown = parseJsonInput(await input.text());
      const out = encode(parsed);
      const ab = new ArrayBuffer(out.length);
      new Uint8Array(ab).set(out);
      blob = new Blob([ab], { type: "application/msgpack" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not encode JSON as MessagePack",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob,
      filename: swapExtension(input.name, "msgpack"),
    };
  },
};

export default jsonToMsgpack;
