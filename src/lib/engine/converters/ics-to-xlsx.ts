import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseIcal, ICAL_COLUMNS } from "../util/ical";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * ICS → XLSX. One row per VEVENT with the same columns as ics-to-csv
 * (uid, summary, start, end, location, description, allDay), emitted
 * as a real Excel workbook so it opens with one click in Excel, Google
 * Sheets, or Numbers.
 */
const icsToXlsx: Converter = {
  id: "ics-to-xlsx",
  label: "ICS → XLSX",
  fromMime: ["text/calendar", "text/plain"],
  accept: [".ics", ".ical", ".ifb"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const events = parseIcal(await input.text());
      if (events.length === 0) throw new Error("No events found in calendar file");
      const Papa = (await import("papaparse")).default;
      const csv = Papa.unparse(
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
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert calendar to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default icsToXlsx;
