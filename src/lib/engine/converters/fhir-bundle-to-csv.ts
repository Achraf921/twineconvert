import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractResources, resourcesToRows } from "../util/fhir";

/**
 * FHIR R4 Bundle → CSV. Flattens every resource in the Bundle into one
 * row per resource, with the union of scalar fields across all resources
 * as columns. Useful for triaging a transaction Bundle in a spreadsheet
 * before importing into a clinical data warehouse.
 */
const fhirBundleToCsv: Converter = {
  id: "fhir-bundle-to-csv",
  label: "FHIR Bundle → CSV",
  fromMime: ["application/fhir+json", "application/json"],
  accept: [".json"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const parsed: unknown = JSON.parse(await input.text());
      const resources = extractResources(parsed);
      if (resources.length === 0) {
        throw new Error(
          "Input has no FHIR resources (expected a Bundle with `entry[]` or a single Resource with `resourceType`)",
        );
      }
      const { headers, rows } = resourcesToRows(resources);
      csv = Papa.unparse({ fields: headers, data: rows }, { newline: "\n" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert FHIR Bundle to CSV",
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

export default fhirBundleToCsv;
