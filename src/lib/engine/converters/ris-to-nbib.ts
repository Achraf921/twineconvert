import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildNbib, parseRis } from "../util/ris";

const risToNbib: Converter = {
  id: "ris-to-nbib",
  label: "RIS → NBIB",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let nbib: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No citations found in RIS");
      nbib = buildNbib(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RIS to NBIB",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([nbib], { type: "application/x-research-info-systems" }),
      filename: swapExtension(input.name, "nbib"),
    };
  },
};

export default risToNbib;
