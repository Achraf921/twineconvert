import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { formatChecksumLine, hashMd5 } from "../util/hash";

const fileToMd5: Converter = {
  id: "file-to-md5",
  label: "File → MD5 checksum",
  fromMime: ["application/octet-stream", "*/*"],
  accept: ["*"],
  toMime: "text/plain",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const hex = await hashMd5(await input.arrayBuffer());
      out = formatChecksumLine(hex, input.name);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not compute MD5",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "md5"),
    };
  },
};

export default fileToMd5;
