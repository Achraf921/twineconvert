import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { hl7ToTree, parseHl7 } from "../util/hl7";

const hl7ToJson: Converter = {
  id: "hl7-to-json",
  label: "HL7 → JSON",
  fromMime: ["application/hl7-v2", "text/plain"],
  accept: [".hl7", ".txt"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const segments = parseHl7(await input.text());
      out = JSON.stringify(hl7ToTree(segments), null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HL7 to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default hl7ToJson;
