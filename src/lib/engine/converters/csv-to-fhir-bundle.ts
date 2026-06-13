import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { stripCsvPreamble } from "../util/csv-parse-flex";
import { rowsToBundle } from "../util/fhir";

/**
 * CSV → FHIR R4 Bundle. Each CSV row becomes one FHIR resource. The
 * `resourceType` column (if present) determines the resource type per
 * row; otherwise every row is treated as a Patient resource.
 *
 * Useful for migrating legacy patient/staff/billing CSV exports into a
 * FHIR-conformant ingestion pipeline (modern EHRs accept FHIR Bundles
 * via the standard $process-message endpoint).
 */
const csvToFhirBundle: Converter = {
  id: "csv-to-fhir-bundle",
  label: "CSV → FHIR Bundle",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/fhir+json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const Papa = (await import("papaparse")).default;
      const { text, delimiter } = stripCsvPreamble(await input.text());
      const parsed = Papa.parse<string[]>(text, {
        skipEmptyLines: true,
        ...(delimiter ? { delimiter } : {}),
      });
      if (parsed.errors.length > 0) {
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      }
      if (parsed.data.length < 2) {
        throw new Error("CSV must have a header row and at least one data row");
      }
      const headers = parsed.data[0];
      const rows = parsed.data.slice(1);
      const bundle = rowsToBundle(headers, rows);
      out = JSON.stringify(bundle, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to FHIR Bundle",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/fhir+json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default csvToFhirBundle;
