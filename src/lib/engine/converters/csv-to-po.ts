import Papa from "papaparse";
import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildPo, type PoEntry } from "../util/po";

/**
 * CSV -> PO. Inverse of po-to-csv. Expects the columns that po-to-csv
 * writes (msgctxt, msgid, msgid_plural, msgstr, msgstr_plurals, comments,
 * extracted, references, flags). Only `msgid` is required on each row;
 * everything else is optional.
 */
const csvToPo: Converter = {
  id: "csv-to-po",
  label: "CSV → PO",
  fromMime: ["text/csv", "text/plain"],
  accept: [".csv"],
  toMime: "text/x-gettext-translation",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",
      });
      if (parsed.errors.length) {
        // Papa flags non-fatal warnings too. Surface the first real error.
        const fatal = parsed.errors.find((e) => e.type === "Quotes" || e.type === "FieldMismatch");
        if (fatal) throw new Error(`CSV parse error: ${fatal.message}`);
      }
      if (!parsed.data.length) {
        throw new Error("CSV has no rows. Expected at least one row with an `msgid` column.");
      }
      const entries: PoEntry[] = parsed.data.map((row, i) => {
        const msgid = row.msgid ?? row.Msgid ?? "";
        if (!msgid && (i > 0 || Object.keys(row).length > 1)) {
          // Allow a single empty-msgid row as the header entry (canonical PO).
          if (i !== 0) {
            throw new Error(`Row ${i + 2} is missing a value in the \`msgid\` column.`);
          }
        }
        const entry: PoEntry = {
          msgid,
          msgstr: row.msgstr ?? "",
        };
        if (row.msgctxt) entry.msgctxt = row.msgctxt;
        if (row.msgid_plural) entry.msgid_plural = row.msgid_plural;
        if (row.msgstr_plurals) {
          try {
            const arr = JSON.parse(row.msgstr_plurals);
            if (Array.isArray(arr)) entry.msgstr = arr.map((v) => String(v ?? ""));
          } catch {
            // If the JSON column is malformed, fall back to the singular msgstr.
          }
        }
        if (row.comments) entry.comments = row.comments.split(/\s*\|\s*/).filter(Boolean);
        if (row.extracted)
          entry.extracted_comments = row.extracted.split(/\s*\|\s*/).filter(Boolean);
        if (row.references) entry.references = row.references.split(/\s+/).filter(Boolean);
        if (row.flags) entry.flags = row.flags.split(/\s*,\s*/).filter(Boolean);
        return entry;
      });
      out = buildPo(entries);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to PO",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/x-gettext-translation;charset=utf-8" }),
      filename: swapExtension(input.name, "po"),
    };
  },
};

export default csvToPo;
