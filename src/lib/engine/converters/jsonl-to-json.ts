import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseJsonl } from "../util/jsonl";

const jsonlToJson: Converter = {
  id: "jsonl-to-json",
  label: "JSONL → JSON",
  fromMime: ["application/jsonl", "application/x-ndjson", "application/json", "text/plain"],
  accept: [".jsonl", ".ndjson"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const values = parseJsonl(await input.text());
      out = JSON.stringify(values, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSONL to JSON",
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

export default jsonlToJson;
