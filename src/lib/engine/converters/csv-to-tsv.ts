import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * CSV → TSV. Same data, different delimiter. Quoting rules differ:
 * CSV uses `"..."` with escaped doubled quotes; TSV typically just
 * forbids tabs/newlines in fields and otherwise has no quoting. We
 * preserve quoted CSV fields by replacing the surrounding quotes and
 * unescaping doubled quotes back to single quotes.
 */
const csvToTsv: Converter = {
  id: "csv-to-tsv",
  label: "CSV → TSV",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "text/tab-separated-values",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let tsv: string;
    try {
      const text = await input.text();
      tsv = csvToTsvText(text);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to TSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" }),
      filename: swapExtension(input.name, "tsv"),
    };
  },
};

function csvToTsvText(csv: string): string {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  while (i < csv.length) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r" && csv[i + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 2;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // TSV: replace any tabs in fields with a space, drop newlines (TSV
  // can't carry them); the alternative is to re-quote, which most TSV
  // consumers don't expect.
  return rows
    .map((r) =>
      r.map((c) => c.replace(/\t/g, " ").replace(/\r?\n/g, " ")).join("\t"),
    )
    .join("\n");
}

export default csvToTsv;
