import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { base64ToText } from "../util/encoding";

const base64ToTextConverter: Converter = {
  id: "base64-to-text",
  label: "Base64 → Text",
  fromMime: ["text/plain"],
  accept: [".txt", ".b64"],
  toMime: "text/plain",
  maxFileSizeBytes: 14 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = base64ToText(await input.text());
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not decode Base64 to text",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default base64ToTextConverter;
