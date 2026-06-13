import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseJsonInput } from "../util/parse-json-input";

/**
 * JSON → YAML. Output uses the safe YAML schema (no arbitrary type
 * tags, no anchors/aliases) so the result round-trips cleanly back to
 * JSON. Indentation defaults to 2 spaces, matching the convention most
 * config files use.
 */
const jsonToYaml: Converter = {
  id: "json-to-yaml",
  label: "JSON → YAML",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let yamlText: string;
    try {
      const yaml = await import("js-yaml");
      const parsed: unknown = parseJsonInput(await input.text());
      yamlText = yaml.dump(parsed, {
        indent: 2,
        // Force standard line width so long arrays don't fold
        lineWidth: -1,
        // Use the safe schema: no !!js/function or other JS-specific tags
        schema: yaml.JSON_SCHEMA,
        // Skip null values being written as `~` (use the more readable
        // `null` literal instead)
        styles: { "!!null": "lowercase" },
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to YAML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([yamlText], { type: "application/x-yaml;charset=utf-8" }),
      filename: swapExtension(input.name, "yaml"),
    };
  },
};

export default jsonToYaml;
