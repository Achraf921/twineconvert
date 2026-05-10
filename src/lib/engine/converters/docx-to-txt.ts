import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const docxToTxt: Converter = {
  id: "docx-to-txt",
  label: "DOCX → TXT",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  toMime: "text/plain",
  accept: [".docx"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let text: string;
    try {
      const mammoth = (await import("mammoth")).default;
      const arrayBuffer = await input.arrayBuffer();
      // mammoth's Node build wants {buffer}, browser build wants {arrayBuffer};
      // pass both so the converter works in either environment.
      const result = await mammoth.extractRawText({ arrayBuffer, buffer: arrayBuffer } as Parameters<typeof mammoth.extractRawText>[0]);
      text = result.value;
    } catch (err) {
      throw new ConvertFailedError(
        "Could not parse DOCX, file may be corrupt or password-protected",
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

export default docxToTxt;
