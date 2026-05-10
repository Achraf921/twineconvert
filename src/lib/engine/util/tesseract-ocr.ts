/**
 * Run Tesseract OCR on an image (or canvas) and return the extracted text.
 *
 * Tesseract.js is heavy (~2-15MB depending on language data + WASM). We
 * lazy-load it per call. The first call also fetches the language model
 * (~10MB for English), subsequent calls reuse the cached model.
 *
 * Default language: English. Multi-language support is a Pro-tier
 * differentiator for later.
 */

export interface OcrOptions {
  /** Tesseract 3-letter language code(s). Default: 'eng'. */
  language?: string;
  /** 0..1 progress callback (text recognition is the slow part). */
  onProgress?: (fraction: number) => void;
}

export async function ocrImage(
  input: File | Blob | HTMLCanvasElement,
  opts: OcrOptions = {},
): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const lang = opts.language ?? "eng";

  const result = await Tesseract.recognize(
    input as Tesseract.ImageLike,
    lang,
    {
      logger: (m) => {
        if (opts.onProgress && m.status === "recognizing text") {
          opts.onProgress(m.progress);
        }
      },
    },
  );

  return result.data.text;
}

export function textToBlob(text: string): Blob {
  return new Blob([text], { type: "text/plain;charset=utf-8" });
}
