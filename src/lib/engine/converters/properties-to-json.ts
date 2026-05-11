import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseProperties } from "../util/properties";

const propertiesToJson: Converter = {
  id: "properties-to-json",
  label: ".properties → JSON",
  fromMime: ["text/plain", "text/x-java-properties"],
  accept: [".properties"],
  toMime: "application/json",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = JSON.stringify(parseProperties(await input.text()), null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert .properties to JSON",
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

export default propertiesToJson;
