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
  const delimiter = sniffDelimiter(text);
  const parsed = Papa.parse<T>(text, {
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
