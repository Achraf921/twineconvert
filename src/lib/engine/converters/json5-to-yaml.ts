import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON5 → YAML. Parses JSON5 into a plain object and re-serialises it as
 * YAML. Structure (keys, nesting, scalars, arrays) carries across;
 * format-specific niceties (comments, anchors) are not preserved.
 */
const json5ToYaml: Converter = {
  id: "json5-to-yaml",
  label: "JSON5 → YAML",
  fromMime: ["application/json5", "application/json", "text/plain"],
  accept: [".json5"],
  toMime: "application/x-yaml",
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
      const yaml = await import("js-yaml");
      out = yaml.dump(obj, { indent: 2, lineWidth: -1, schema: yaml.JSON_SCHEMA });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON5 to YAML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-yaml;charset=utf-8" }),
      filename: swapExtension(input.name, "yaml"),
    };
  },
};

export default json5ToYaml;
