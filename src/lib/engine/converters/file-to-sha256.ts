import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { formatChecksumLine, hashSubtle } from "../util/hash";

const fileToSha256: Converter = {
  id: "file-to-sha256",
  label: "File → SHA-256 checksum",
  fromMime: ["application/octet-stream", "*/*"],
  accept: ["*"],
  toMime: "text/plain",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const hex = await hashSubtle(await input.arrayBuffer(), "SHA-256");
      out = formatChecksumLine(hex, input.name);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not compute SHA-256",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "sha256"),
    };
  },
};

export default fileToSha256;
