import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const csvToYaml: Converter = {
  id: "csv-to-yaml",
  label: "CSV → YAML",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/x-yaml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let yamlText: string;
    try {
      const Papa = (await import("papaparse")).default;
      const yaml = await import("js-yaml");
      const parsed = Papa.parse<Record<string, unknown>>(await input.text(), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      if (parsed.errors.length > 0) {
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      }
      yamlText = yaml.dump(parsed.data, {
        indent: 2,
        lineWidth: -1,
        schema: yaml.JSON_SCHEMA,
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to YAML",
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

export default csvToYaml;
