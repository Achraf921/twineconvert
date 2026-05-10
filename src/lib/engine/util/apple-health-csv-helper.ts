/**
 * Shared CSV builder for the per-metric Apple Health converters
 * (heart-rate, steps, workouts, sleep, active energy, etc.). Pulls out
 * the boilerplate of "parse → filter by type → render CSV with the right
 * column shape" so each per-metric converter stays ~30 lines.
 */

import type { ConvertOptions, ConvertResult } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "./canvas-encode";
import { parseAppleHealth } from "./apple-health-parse";

export interface MetricCsvOptions {
  /** Apple Health type ids (without HK prefix). e.g. ["HeartRate", "RestingHeartRate"] */
  recordTypes: string[];
  /** Optional column rename for the value column. Default "value". */
  valueColumnName?: string;
}

export async function buildMetricCsv(
  input: File,
  recordTypes: string[],
  valueLabel: string,
  opts?: ConvertOptions,
): Promise<ConvertResult> {
  opts?.onProgress?.(0.02);
  try {
    const { records } = await parseAppleHealth(input, {
      recordTypes,
      includeWorkouts: false,
      onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.85),
    });
    const Papa = (await import("papaparse")).default;
    const csv = Papa.unparse(
      records.map((r) => ({
        type: r.type,
        startDate: r.startDate,
        endDate: r.endDate,
        [valueLabel]: r.value ?? "",
        unit: r.unit ?? "",
        source: r.sourceName ?? "",
      })),
    );
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name.replace(/\.zip$/i, ".xml"), "csv"),
    };
  } catch (err) {
    throw new ConvertFailedError(
      err instanceof Error ? err.message : "Could not parse Apple Health export",
      err,
    );
  }
}
