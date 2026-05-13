import Papa from "papaparse";
import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePo } from "../util/po";

/**
 * PO -> CSV. Each translation entry becomes one row.
 *
 * Columns (kept lossless for round-trip with csv-to-po):
 *   - msgctxt        disambiguation context (often empty)
 *   - msgid          source string (key)
 *   - msgid_plural   present only on plural entries
 *   - msgstr         single translation when not plural
 *   - msgstr_plurals JSON-encoded array of plural forms when plural
 *   - comments       translator comments joined by ` | `
 *   - extracted      developer comments joined by ` | `
 *   - references     source refs joined by ` `
 *   - flags          gettext flags joined by `, `
 *
 * Plural forms ride in a JSON-encoded cell rather than expanding into
 * msgstr_0..msgstr_N columns because the number of forms varies by
 * language (English/Spanish/2, Russian/Czech/3, Arabic/6).
 */
const poToCsv: Converter = {
  id: "po-to-csv",
  label: "PO → CSV",
  fromMime: ["text/plain", "text/x-gettext-translation", "application/x-gettext"],
  accept: [".po", ".pot"],
  toMime: "text/csv",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const entries = parsePo(await input.text());
      if (entries.length === 0) {
        throw new Error(
          "No translation entries found. Make sure the file starts with `msgid` / `msgstr` blocks.",
        );
      }
      const rows = entries.map((e) => ({
        msgctxt: e.msgctxt ?? "",
        msgid: e.msgid,
        msgid_plural: e.msgid_plural ?? "",
        msgstr: Array.isArray(e.msgstr) ? "" : e.msgstr,
        msgstr_plurals: Array.isArray(e.msgstr) ? JSON.stringify(e.msgstr) : "",
        comments: (e.comments ?? []).join(" | "),
        extracted: (e.extracted_comments ?? []).join(" | "),
        references: (e.references ?? []).join(" "),
        flags: (e.flags ?? []).join(", "),
      }));
      // newline: "\n" so the final row's last cell doesn't absorb a stray
      // \n on round-trip (the CSV CRLF bug we caught in the bijectivity audit).
      csv = Papa.unparse(rows, { newline: "\n" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PO to CSV",
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

export default poToCsv;
