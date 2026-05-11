import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { textToUrlEncoded } from "../util/encoding";

const textToUrlEncodedConverter: Converter = {
  id: "text-to-url-encoded",
  label: "Text → URL-encoded",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = textToUrlEncoded(await input.text());
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not URL-encode text",
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

export default textToUrlEncodedConverter;
