import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { encodeIco } from "../util/ico-encode";

const jpgToIco: Converter = {
  id: "jpg-to-ico",
  label: "JPG → ICO (favicon)",
  fromMime: ["image/jpeg"],
  accept: [".jpg", ".jpeg"],
  toMime: "image/x-icon",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      blob = await encodeIco(input);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not encode ICO",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "ico") };
  },
};

export default jpgToIco;
