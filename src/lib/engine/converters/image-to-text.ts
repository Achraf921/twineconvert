import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { ocrImage, textToBlob } from "../util/tesseract-ocr";

/**
 * Image → Text via Tesseract OCR. Accepts the common web image formats
 * the browser can decode; Tesseract internally rasterizes via Canvas.
 */
const imageToText: Converter = {
  id: "image-to-text",
  label: "Image → Text",
  fromMime: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/gif",
  ],
  toMime: "text/plain",
  accept: [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"],
  maxFileSizeBytes: 30 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let text: string;
    try {
      text = await ocrImage(input, {
        onProgress: (p) => opts?.onProgress?.(0.1 + p * 0.85),
      });
    } catch (err) {
      throw new ConvertFailedError(
        "OCR failed, image may be too small, blurry, or contain no readable text",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: textToBlob(text),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default imageToText;
