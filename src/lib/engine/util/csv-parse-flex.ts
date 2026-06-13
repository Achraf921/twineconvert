/**
 * Flexible CSV parser shared by every csv-to-X converter.
 *
 * Real CSV exports from logging software, accounting tools, EU-locale
 * Excel, and reference managers vary in:
 *   - delimiter (comma, semicolon, tab, pipe)
 *   - row regularity (ragged rows, trailing delimiters, commas in
 *     unquoted comment fields all produce Papa "FieldMismatch" warnings
 *     even though the data is still usable)
 *
 * Hardcoding a comma and treating FieldMismatch as fatal was the
 * systemic cause of csv-to-adif failing 100% of live attempts (PostHog
 * convert_error sweep, 2026-05-15). This helper centralises the fix so
 * every csv-to-X path gets it.
 *
 * Only an unparseable quote state is treated as fatal here; everything
 * else is recoverable and callers should proceed with whatever rows
 * Papa returned, falling back to their own "no usable data" guard.
 */

import Papa from "papaparse";

export interface FlexParseResult<T> {
  rows: T[];
  /** Sniffed delimiter, exposed for diagnostics/tests. */
  delimiter: string;
}

export interface FlexParseOptions {
  /** Treat the first row as the column headers (default true). */
  header?: boolean;
}

/**
 * Strip the two things that silently break real-world CSV exports before
 * any delimiter sniffing or parsing:
 *   1. A leading UTF-8 BOM (corrupts the first header name).
 *   2. An Excel locale-hint line `sep=;` / `sep=,` that many "Save as
 *      CSV" exports (especially non-US Excel) prepend. Left in, the
 *      parser reads `sep=;` AS the header row and every real column is
 *      lost. When present, its character is the intended delimiter.
 * Returns the cleaned text and, if a sep= line declared one, the
 * delimiter to use (overriding the sniff).
 */
export function stripCsvPreamble(text: string): { text: string; delimiter?: string } {
  const body = text.replace(/^﻿/, "");
  const sepMatch = body.match(/^sep=(.)\r?\n/i);
  if (sepMatch) {
    const delimiter = sepMatch[1] === "\\t" ? "\t" : sepMatch[1];
    return { text: body.slice(sepMatch[0].length), delimiter };
  }
  return { text: body };
}

/** Pick the delimiter that splits the header line into the most columns. */
export function sniffDelimiter(text: string): string {
  const head = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t", "|"] as const;
  let best = ",";
  let bestN = 0;
  for (const d of candidates) {
    const n = head.split(d).length;
    if (n > bestN) {
      bestN = n;
      best = d;
    }
  }
  return best;
}

export function parseCsvFlex<T = Record<string, string>>(
  text: string,
  opts: FlexParseOptions = {},
): FlexParseResult<T> {
  const pre = stripCsvPreamble(text);
  const delimiter = pre.delimiter ?? sniffDelimiter(pre.text);
  const parsed = Papa.parse<T>(pre.text, {
    header: opts.header ?? true,
    skipEmptyLines: true,
    delimiter,
  });
  // Only a genuinely unparseable quote state is fatal. FieldMismatch
  // (ragged rows / commas inside unquoted text) is normal in real
  // exports and Papa still returns usable rows.
  const fatal = parsed.errors.find((e) => e.type === "Quotes");
  if (fatal) {
    throw new Error(
      `CSV is malformed (${fatal.message}${fatal.row != null ? ` near row ${fatal.row + 2}` : ""}). ` +
        "Re-export from the source tool, or open in a spreadsheet and re-save as CSV.",
    );
  }
  return { rows: parsed.data, delimiter };
}
