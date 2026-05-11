import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * YAML → JSON. Uses js-yaml's safe load (no arbitrary type
 * instantiation, no anchor explosion vulnerability). Output is pretty
 * printed with 2-space indent so the result is human-readable.
 *
 * Bijective with json-to-yaml for the standard YAML 1.2 / JSON-Schema
 * subset that doesn't use YAML-specific features (anchors/aliases,
 * custom tags, multi-document streams).
 */
const yamlToJson: Converter = {
  id: "yaml-to-json",
  label: "YAML → JSON",
  fromMime: ["application/x-yaml", "text/yaml", "text/plain"],
  accept: [".yaml", ".yml"],
  toMime: "application/json",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const yaml = await import("js-yaml");
      const parsed = yaml.load(await input.text(), {
        // Reject unknown tags rather than dropping silently
        onWarning: (w) => {
          throw w;
        },
      });
      if (parsed === null || parsed === undefined) {
        throw new Error("YAML is empty or contains only null");
      }
      json = JSON.stringify(parsed, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert YAML to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default yamlToJson;
