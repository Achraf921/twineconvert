import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildIcal, eventFromRow } from "../util/ical";

const csvToIcs: Converter = {
  id: "csv-to-ics",
  label: "CSV → ICS",
  fromMime: ["text/csv", "application/csv"],
  accept: [".csv"],
  toMime: "text/calendar",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ics: string;
    try {
      const Papa = (await import("papaparse")).default;
      const parsed = Papa.parse<Record<string, string>>(await input.text(), {
        header: true,
        skipEmptyLines: true,
      });
      const rows = (parsed.data ?? []).filter(
        (r) => r && typeof r === "object" && Object.keys(r).length > 0,
      );
      if (rows.length === 0) throw new Error("No rows found in CSV");
      const events = rows.map(eventFromRow);
      if (events.every((e) => !e.summary && !e.start)) {
        throw new Error(
          "CSV needs at least a 'summary' or 'start' column to build calendar events",
        );
      }
      ics = buildIcal(events);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to calendar",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([ics], { type: "text/calendar;charset=utf-8" }),
      filename: swapExtension(input.name, "ics"),
    };
  },
};

export default csvToIcs;
