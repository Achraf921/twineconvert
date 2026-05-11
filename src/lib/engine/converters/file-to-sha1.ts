import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { formatChecksumLine, hashSubtle } from "../util/hash";

const fileToSha1: Converter = {
  id: "file-to-sha1",
  label: "File → SHA-1 checksum",
  fromMime: ["application/octet-stream", "*/*"],
  accept: ["*"],
  toMime: "text/plain",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const hex = await hashSubtle(await input.arrayBuffer(), "SHA-1");
      out = formatChecksumLine(hex, input.name);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not compute SHA-1",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "sha1"),
    };
  },
};

export default fileToSha1;
