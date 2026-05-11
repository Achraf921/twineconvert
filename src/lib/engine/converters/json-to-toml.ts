import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON → TOML. Reverse of toml-to-json. Note that TOML's type system
 * is more restrictive than JSON's: arrays must be homogeneous, the top
 * level must be an object/table (not an array), and keys can't be
 * arbitrary unicode without quoting. The serializer raises clear errors
 * for incompatible inputs rather than silently dropping data.
 */
const jsonToToml: Converter = {
  id: "json-to-toml",
  label: "JSON → TOML",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/toml",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let toml: string;
    try {
      const TOML = await import("@iarna/toml");
      const parsed: unknown = JSON.parse(await input.text());
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "TOML's top level must be a JSON object (table). Wrap an array in {data: [...]} first.",
        );
      }
      toml = TOML.stringify(parsed as Record<string, unknown> as Parameters<typeof TOML.stringify>[0]);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not write TOML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([toml], { type: "application/toml;charset=utf-8" }),
      filename: swapExtension(input.name, "toml"),
    };
  },
};

export default jsonToToml;
