import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildProperties } from "../util/properties";
import { parseJsonInput } from "../util/parse-json-input";

const jsonToProperties: Converter = {
  id: "json-to-properties",
  label: "JSON → .properties",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/x-java-properties",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error(".properties requires a flat object of key/value pairs");
      }
      // Properties don't have a nesting concept; reject nested objects so
      // we don't silently lose data with stringification
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "object" && v !== null) {
          throw new Error(`.properties can't represent nested objects (key: "${k}")`);
        }
      }
      out = buildProperties(parsed as Record<string, unknown>);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to .properties",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/x-java-properties;charset=utf-8" }),
      filename: swapExtension(input.name, "properties"),
    };
  },
};

export default jsonToProperties;
