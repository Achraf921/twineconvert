import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAppleHealth } from "../util/apple-health-parse";

const appleHealthToCsv: Converter = {
  id: "apple-health-to-csv",
  label: "Apple Health → CSV",
  fromMime: ["application/zip", "text/xml", "application/xml"],
  toMime: "text/csv",
  // Accept the literal export.zip (most common) and the unzipped export.xml
  accept: [".zip", ".xml"],
  // Apple Health exports get huge, 500MB is roughly the upper bound for
  // a heavy multi-year user; bigger and we'd need true streaming-to-disk.
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let csv: string;
    try {
      const { records } = await parseAppleHealth(input, {
        includeWorkouts: false,
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.85),
      });
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        records.map((r) => ({
          type: r.type,
          startDate: r.startDate,
          endDate: r.endDate,
          value: r.value ?? "",
          unit: r.unit ?? "",
          source: r.sourceName ?? "",
        })),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse Apple Health export",
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

export default appleHealthToCsv;
