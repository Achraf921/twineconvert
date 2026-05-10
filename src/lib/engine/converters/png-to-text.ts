import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ocrImage, textToBlob } from "../util/tesseract-ocr";

const pngToText: Converter = {
  id: "png-to-text",
  label: "PNG → Text",
  fromMime: ["image/png"],
  toMime: "text/plain",
  accept: [".png"],
  maxFileSizeBytes: 30 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let text: string;
    try {
      text = await ocrImage(input, {
        onProgress: (p) => opts?.onProgress?.(0.1 + p * 0.85),
      });
    } catch (err) {
      throw new ConvertFailedError("OCR failed — image may be unreadable", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: textToBlob(text),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default pngToText;
