import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseIcal } from "../util/ical";

const icsToJson: Converter = {
  id: "ics-to-json",
  label: "ICS → JSON",
  fromMime: ["text/calendar", "text/plain"],
  accept: [".ics", ".ical", ".ifb"],
  toMime: "application/json",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const events = parseIcal(await input.text());
      if (events.length === 0) throw new Error("No events found in calendar file");
      json = JSON.stringify(events, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert calendar to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default icsToJson;
