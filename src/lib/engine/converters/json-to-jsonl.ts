import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildJsonl } from "../util/jsonl";
import { parseJsonInput } from "../util/parse-json-input";

const jsonToJsonl: Converter = {
  id: "json-to-jsonl",
  label: "JSON → JSONL",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/jsonl",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      // JSONL only makes sense for arrays. If a top-level value isn't an
      // array, wrap it as a single-item one — the caller probably meant
      // "convert this object to a 1-line JSONL file", which is valid.
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      out = buildJsonl(arr);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to JSONL",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/jsonl;charset=utf-8" }),
      filename: swapExtension(input.name, "jsonl"),
    };
  },
};

export default jsonToJsonl;
