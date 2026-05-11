import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * TOML → JSON. Uses @iarna/toml's strict v1.0 parser. Output is pretty
 * printed with 2-space indent. Bijective with json-to-toml for the
 * standard TOML 1.0 subset.
 *
 * Common use case: converting Cargo.toml, pyproject.toml, or any
 * Rust/Python config to JSON for tooling that doesn't speak TOML.
 */
const tomlToJson: Converter = {
  id: "toml-to-json",
  label: "TOML → JSON",
  fromMime: ["application/toml", "text/plain"],
  accept: [".toml"],
  toMime: "application/json",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const TOML = await import("@iarna/toml");
      const parsed = TOML.parse(await input.text());
      json = JSON.stringify(parsed, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse TOML",
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

export default tomlToJson;
