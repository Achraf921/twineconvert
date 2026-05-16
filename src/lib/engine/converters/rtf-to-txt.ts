import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { rtfToText } from "../util/rtf";

const rtfToTxt: Converter = {
  id: "rtf-to-txt",
  label: "RTF → TXT",
  fromMime: ["application/rtf", "text/rtf", "text/plain"],
  accept: [".rtf"],
  toMime: "text/plain",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let text: string;
    try {
      const raw = await input.text();
      if (!raw.trimStart().startsWith("{\\rtf")) {
        throw new Error("Not an RTF file (missing {\\rtf header)");
      }
      text = rtfToText(raw);
      if (text.trim().length === 0) throw new Error("RTF contained no extractable text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RTF to text",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([text], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default rtfToTxt;
