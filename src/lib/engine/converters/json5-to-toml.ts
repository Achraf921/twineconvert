import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON5 → TOML. Parses JSON5 into a plain object and re-serialises it as
 * TOML. Structure (keys, nesting, scalars, arrays) carries across;
 * format-specific niceties (comments, anchors) are not preserved.
 */
const json5ToToml: Converter = {
  id: "json5-to-toml",
  label: "JSON5 → TOML",
  fromMime: ["application/json5", "application/json", "text/plain"],
  accept: [".json5"],
  toMime: "application/toml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const JSON5 = (await import("json5")).default;
      const obj = JSON5.parse(await input.text());
      if (obj == null || typeof obj !== "object") {
        throw new Error("The JSON5 did not parse into a key/value document.");
      }
      const TOML = await import("@iarna/toml");
      out = TOML.stringify(obj as Parameters<typeof TOML.stringify>[0]);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON5 to TOML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/toml;charset=utf-8" }),
      filename: swapExtension(input.name, "toml"),
    };
  },
};

export default json5ToToml;
