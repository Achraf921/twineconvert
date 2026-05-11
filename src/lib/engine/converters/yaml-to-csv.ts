import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const yamlToCsv: Converter = {
  id: "yaml-to-csv",
  label: "YAML → CSV",
  fromMime: ["application/x-yaml", "text/yaml", "text/plain"],
  accept: [".yaml", ".yml"],
  toMime: "text/csv",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const yaml = await import("js-yaml");
      const parsed = yaml.load(await input.text(), { schema: yaml.JSON_SCHEMA });
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const records = arr.filter(
        (v): v is Record<string, unknown> =>
          typeof v === "object" && v !== null && !Array.isArray(v),
      );
      if (records.length === 0) {
        throw new Error("YAML must contain an array of objects (or a single object) to flatten to CSV");
      }
      csv = Papa.unparse(records, { newline: "\n" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert YAML to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv + "\n"], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default yamlToCsv;
