import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAppleHealth } from "../util/apple-health-parse";

/**
 * Workouts are a separate XML element from records (`<Workout>` vs `<Record>`),
 * so this converter pulls from the workouts bucket and ignores per-metric
 * records. Output columns mirror Apple's workout fields.
 */
const appleHealthWorkoutsToCsv: Converter = {
  id: "apple-health-workouts-to-csv",
  label: "Apple Health Workouts → CSV",
  fromMime: ["application/zip", "text/xml", "application/xml"],
  toMime: "text/csv",
  accept: [".zip", ".xml"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let csv: string;
    try {
      const { workouts } = await parseAppleHealth(input, {
        recordTypes: [], // empty filter → no records, only workouts
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.85),
      });
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        workouts.map((w) => ({
          activityType: w.activityType,
          startDate: w.startDate,
          endDate: w.endDate,
          durationMinutes: w.durationMinutes ?? "",
          totalDistance: w.totalDistance ?? "",
          distanceUnit: w.distanceUnit ?? "",
          totalEnergyBurned: w.totalEnergyBurned ?? "",
          energyUnit: w.energyUnit ?? "",
          source: w.sourceName ?? "",
        })),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse Apple Health workouts",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name.replace(/\.zip$/i, ".xml"), "csv"),
    };
  },
};

export default appleHealthWorkoutsToCsv;
