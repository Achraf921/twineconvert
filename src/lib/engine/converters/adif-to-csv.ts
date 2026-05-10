import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAdif } from "../util/adif";

/**
 * ADIF → CSV. Picks the most-asked-for ADIF tags as columns and
 * passes the rest through as additional columns when present.
 *
 * The "common" tag set chosen here matches what LoTW, eQSL, QRZ, and
 * Club Log all use for their CSV exports, so users importing this
 * back into another tool get the columns those tools expect.
 */
const COMMON_TAGS = [
  "CALL", "QSO_DATE", "TIME_ON", "TIME_OFF", "BAND", "MODE", "FREQ",
  "RST_SENT", "RST_RCVD", "STATION_CALLSIGN", "OPERATOR", "MY_GRIDSQUARE",
  "GRIDSQUARE", "NAME", "QTH", "STATE", "COUNTRY", "DXCC", "CONT", "CQZ", "ITUZ",
  "TX_PWR", "RX_PWR", "COMMENT", "NOTES",
];

const adifToCsv: Converter = {
  id: "adif-to-csv",
  label: "ADIF → CSV",
  fromMime: ["text/plain", "application/x-adif"],
  accept: [".adi", ".adif"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const text = await input.text();
      const { qsos } = parseAdif(text);
      // Discover any extra tags that show up in the file but aren't in COMMON_TAGS,
      // and append them so we don't drop user data on round-trip.
      const extraTags = new Set<string>();
      for (const qso of qsos) {
        for (const tag of Object.keys(qso.fields)) {
          if (!COMMON_TAGS.includes(tag)) extraTags.add(tag);
        }
      }
      const allTags = [...COMMON_TAGS, ...Array.from(extraTags).sort()];
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse({
        fields: allTags,
        data: qsos.map((q) => allTags.map((t) => q.fields[t] ?? "")),
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse ADIF",
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

export default adifToCsv;
