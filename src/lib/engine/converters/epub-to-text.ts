import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractEpub } from "../util/epub-extract";

const epubToText: Converter = {
  id: "epub-to-text",
  label: "EPUB → Text",
  fromMime: ["application/epub+zip"],
  toMime: "text/plain",
  accept: [".epub"],
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let text: string;
    try {
      const extracted = await extractEpub(input);
      text = extracted.text;
    } catch (err) {
      throw new ConvertFailedError("Could not parse EPUB", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([text], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default epubToText;
