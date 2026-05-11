import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const tomlToYaml: Converter = {
  id: "toml-to-yaml",
  label: "TOML → YAML",
  fromMime: ["application/toml", "text/plain"],
  accept: [".toml"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const toml = await import("@iarna/toml");
      const yaml = await import("js-yaml");
      const parsed = toml.parse(await input.text());
      out = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        schema: yaml.JSON_SCHEMA,
        styles: { "!!null": "lowercase" },
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert TOML to YAML",
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

export default tomlToYaml;
