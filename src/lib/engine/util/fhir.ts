/**
 * FHIR R4 Bundle helpers. FHIR (Fast Healthcare Interoperability Resources)
 * is the modern HL7 standard — JSON resources for Patient, Observation,
 * Condition, MedicationRequest, etc. A Bundle wraps multiple resources for
 * batch transfer (the FHIR equivalent of a multi-message HL7 batch).
 *
 * Bundle structure:
 *   {
 *     "resourceType": "Bundle",
 *     "type": "collection" | "transaction" | "searchset",
 *     "entry": [
 *       { "resource": { "resourceType": "Patient", "id": "...", ... } },
 *       { "resource": { "resourceType": "Observation", ... } }
 *     ]
 *   }
 *
 * Real Bundles can have hundreds of resources of mixed types. We flatten
 * each resource type into its own column-set so the output CSV has one
 * row per resource with the resource type as the first column.
 */

export interface FhirResource {
  resourceType: string;
  id?: string;
  [k: string]: unknown;
}

export interface FhirBundle {
  resourceType: "Bundle";
  type?: string;
  entry?: Array<{ resource?: FhirResource }>;
}

export function isFhirBundle(value: unknown): value is FhirBundle {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { resourceType?: unknown }).resourceType === "Bundle"
  );
}

/** Extract resources out of a Bundle (or treat a single Resource as a
 *  one-element Bundle). Returns the flat list of FHIR resources. */
export function extractResources(value: unknown): FhirResource[] {
  if (isFhirBundle(value)) {
    return (value.entry ?? [])
      .map((e) => e.resource)
      .filter((r): r is FhirResource => !!r && typeof r === "object");
  }
  if (typeof value === "object" && value !== null && "resourceType" in value) {
    return [value as FhirResource];
  }
  return [];
}

/** Flatten resources into rows with one column per (resource × top-level
 *  scalar field). Skips nested object/array fields — they don't fit a
 *  flat CSV anyway, and analysts looking at a CSV mostly want the scalars
 *  (id, status, dates, codes, refs). */
export function resourcesToRows(resources: FhirResource[]): {
  headers: string[];
  rows: string[][];
} {
  const colSet = new Set<string>(["resourceType", "id"]);
  for (const r of resources) {
    for (const [k, v] of Object.entries(r)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        colSet.add(k);
      }
    }
  }
  const headers = Array.from(colSet);
  const rows = resources.map((r) =>
    headers.map((h) => {
      const v = (r as Record<string, unknown>)[h];
      if (v == null) return "";
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        return String(v);
      }
      // Nested object/array: don't flatten arbitrarily, just JSON-encode it
      return JSON.stringify(v);
    }),
  );
  return { headers, rows };
}

/** Build a minimal FHIR Bundle from a list of CSV rows. Each row becomes
 *  a resource of `resourceType`, with each column → a top-level scalar
 *  field. The `resourceType` column is required if rows have mixed types;
 *  otherwise pass `defaultType` (e.g. "Patient"). */
export function rowsToBundle(
  headers: string[],
  rows: string[][],
  defaultType = "Patient",
): FhirBundle {
  const typeColIdx = headers.indexOf("resourceType");
  const entries: Array<{ resource: FhirResource }> = rows.map((row) => {
    const resourceType = typeColIdx >= 0 && row[typeColIdx] ? row[typeColIdx] : defaultType;
    const resource: FhirResource = { resourceType };
    for (let i = 0; i < headers.length; i++) {
      if (i === typeColIdx) continue;
      const val = row[i];
      if (val == null || val === "") continue;
      // Try to preserve number / boolean type when the input is unambiguous
      const h = headers[i];
      if (val === "true") resource[h] = true;
      else if (val === "false") resource[h] = false;
      else if (/^-?\d+$/.test(val)) resource[h] = parseInt(val, 10);
      else if (/^-?\d*\.\d+$/.test(val)) resource[h] = parseFloat(val);
      else resource[h] = val;
    }
    return { resource };
  });
  return { resourceType: "Bundle", type: "collection", entry: entries };
}
