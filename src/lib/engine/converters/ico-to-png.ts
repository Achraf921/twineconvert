import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

/**
 * ICO → PNG. Browsers natively decode .ico via <img>, so this is just
 * canvas re-encoding at the largest available size. The canvasEncode
 * helper handles the decode-via-image-tag step for us.
 */
const icoToPng: Converter = {
  id: "ico-to-png",
  label: "ICO → PNG",
  fromMime: ["image/x-icon", "image/vnd.microsoft.icon"],
  accept: [".ico"],
  toMime: "image/png",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.2);
    const blob = await canvasEncode(input, { toMime: "image/png" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default icoToPng;
