import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON5 → JSON. JSON5 = JSON + comments, trailing commas, unquoted keys,
 * single quotes, multi-line strings, hex literals. Used heavily in
 * tsconfig.json (which is technically JSON5), Babel configs, and many other
 * dev-tooling configs. Strict JSON parsers reject these; this gives users a
 * one-step strip path.
 *
 * One-way only: JSON → JSON5 doesn't make sense as a tool because JSON IS
 * valid JSON5 (every JSON file is also a JSON5 file unchanged).
 */
const json5ToJson: Converter = {
  id: "json5-to-json",
  label: "JSON5 → JSON",
  fromMime: ["application/json5", "application/json", "text/plain"],
  accept: [".json5"],
  toMime: "application/json",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const JSON5 = (await import("json5")).default;
      const parsed: unknown = JSON5.parse(await input.text());
      out = JSON.stringify(parsed, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON5 to JSON",
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

export default json5ToJson;
