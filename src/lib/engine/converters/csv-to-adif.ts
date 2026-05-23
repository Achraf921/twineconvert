import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAdif, type AdifQso } from "../util/adif";

const csvToAdif: Converter = {
  id: "csv-to-adif",
  label: "CSV → ADIF",
  fromMime: ["text/csv", "application/csv"],
  accept: [".csv"],
  toMime: "application/x-adif",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let adif: string;
    try {
      const text = await input.text();
      // A non-CSV file renamed .csv (a JSON dump, an .adi file, binary)
      // is the common misuse caught via PostHog convert_error. Detect
      // the obvious cases up front with an actionable message instead
      // of crashing in the row .map with a cryptic stack.
      const head = text.replace(/^﻿/, "").trimStart();
      if (head.startsWith("{") || head.startsWith("[")) {
        throw new Error(
          "This looks like JSON, not CSV. csv-to-adif expects a comma-separated file with a header row (CALL, QSO_DATE, BAND, MODE, ...). Export your log as CSV from your logging software first.",
        );
      }
      if (head.toUpperCase().includes("<EOR>") || /^<[A-Za-z]+:\d/.test(head)) {
        throw new Error(
          "This is already an ADIF (.adi) file, not a CSV — no conversion needed; it's ready to import into your logging software as-is.",
        );
      }
      const { parseCsvFlex } = await import("../util/csv-parse-flex");
      const parsed = parseCsvFlex<Record<string, string>>(text);
      const rows = parsed.rows.filter(
        (r): r is Record<string, string> =>
          typeof r === "object" && r !== null && !Array.isArray(r),
      );
      const qsos: AdifQso[] = rows
        .map((row) => {
          const fields: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            if (v != null && String(v).trim()) fields[k.toUpperCase()] = String(v).trim();
          }
          return { fields };
        })
        .filter((q) => Object.keys(q.fields).length > 0);
      if (qsos.length === 0) {
        throw new Error(
          "No log entries found. The CSV needs a header row plus at least one data row. " +
            "ADIF expects columns like CALL, QSO_DATE (YYYYMMDD), TIME_ON (HHMM), BAND, MODE.",
        );
      }
      adif = buildAdif({ header: {}, qsos });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build ADIF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([adif], { type: "application/x-adif" }),
      filename: swapExtension(input.name, "adi"),
    };
  },
};

export default csvToAdif;
