import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * YAML → TOML, going through a JSON intermediate so we don't have to maintain
 * a direct AST converter. js-yaml + @iarna/toml handle every edge case the
 * intermediate JSON model can express — anything YAML-specific that doesn't
 * map (anchors, custom tags) gets dropped at the YAML parse step, which is
 * the right tradeoff for a config-file converter.
 */
const yamlToToml: Converter = {
  id: "yaml-to-toml",
  label: "YAML → TOML",
  fromMime: ["application/x-yaml", "text/yaml", "text/plain"],
  accept: [".yaml", ".yml"],
  toMime: "application/toml",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const yaml = await import("js-yaml");
      const tomlMod = await import("@iarna/toml");
      const parsed = yaml.load(await input.text(), { schema: yaml.JSON_SCHEMA });
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("TOML requires a top-level table (object), not an array or scalar");
      }
      out = tomlMod.stringify(parsed as Record<string, unknown> as Parameters<typeof tomlMod.stringify>[0]);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert YAML to TOML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out + "\n"], { type: "application/toml;charset=utf-8" }),
      filename: swapExtension(input.name, "toml"),
    };
  },
};

export default yamlToToml;
