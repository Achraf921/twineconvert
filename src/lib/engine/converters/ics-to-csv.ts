import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseIcal, ICAL_COLUMNS } from "../util/ical";

const icsToCsv: Converter = {
  id: "ics-to-csv",
  label: "ICS → CSV",
  fromMime: ["text/calendar", "text/plain"],
  accept: [".ics", ".ical", ".ifb"],
  toMime: "text/csv",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const events = parseIcal(await input.text());
      if (events.length === 0) throw new Error("No events found in calendar file");
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        events.map((e) => ({
          uid: e.uid,
          summary: e.summary,
          start: e.start,
          end: e.end,
          location: e.location,
          description: e.description,
          allDay: e.allDay,
        })),
        { columns: ICAL_COLUMNS as string[] },
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert calendar to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default icsToCsv;
