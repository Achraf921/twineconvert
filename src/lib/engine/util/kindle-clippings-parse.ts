/**
 * Parser for Kindle's `My Clippings.txt` file.
 *
 * The file is plaintext with entries separated by a line of `==========`.
 * Each entry has 4 lines:
 *
 *   1. Book Title (Author Name)
 *   2. - Your Highlight on Location 1234-5678 | Added on Wednesday, January 1, 2025 1:23:45 PM
 *      (or "Your Note on Page 12 | Added on ...", or "Your Bookmark on Location ...")
 *   3. (blank)
 *   4. The actual highlight/note text (may span multiple lines for notes).
 *
 * Authors are inside the trailing parentheses of line 1 — but some books
 * use the format "Title - Author" or just "Title" with no author. We try
 * the parens form first and fall back to the whole line as title if it
 * doesn't match.
 *
 * Localization note: the second line is fully localized in non-English
 * Kindles ("Surlignement" in French, "Markierung" in German, etc.).
 * Our regex handles English; non-English will fall through to a "highlight"
 * default — better than failing.
 */

export type ClippingType = "highlight" | "note" | "bookmark";

export interface KindleClipping {
  book: string;
  author?: string;
  type: ClippingType;
  /** Page number when present (notes/highlights on books with real pagination). */
  page?: string;
  /** Kindle Location range (e.g. "1234-1245"). */
  location?: string;
  /** Date the highlight was added, as parsed from the second line. */
  addedAt?: string;
  /** The highlighted/noted text body. Empty for bookmarks. */
  text: string;
}

const ENTRY_SEPARATOR = "==========";

function parseHeader(line: string): {
  type: ClippingType;
  page?: string;
  location?: string;
  addedAt?: string;
} {
  // Detect type from the leading verb after "- Your"
  let type: ClippingType = "highlight";
  if (/Your Note/i.test(line)) type = "note";
  else if (/Your Bookmark/i.test(line)) type = "bookmark";

  // Extract page (if present)
  const pageMatch = line.match(/Page\s+([\w.-]+)/i);
  const page = pageMatch?.[1];

  // Extract location range
  const locMatch = line.match(/Location\s+([\d-]+)/i);
  const location = locMatch?.[1];

  // Extract date — everything after "Added on "
  const dateMatch = line.match(/Added on\s+(.+)$/i);
  const addedAt = dateMatch?.[1].trim();

  return { type, page, location, addedAt };
}

function parseTitleLine(line: string): { book: string; author?: string } {
  // "(Author)" at the end — handle nested parens by taking the LAST balanced pair.
  const m = line.match(/^(.*)\s*\(([^()]+)\)\s*$/);
  if (m) return { book: m[1].trim(), author: m[2].trim() };
  return { book: line.trim() };
}

export function parseKindleClippings(raw: string): KindleClipping[] {
  // The Kindle file frequently starts with a UTF-8 BOM (﻿) which
  // breaks the first title line if not stripped.
  const stripped = raw.replace(/^﻿/, "");
  const entries = stripped.split(ENTRY_SEPARATOR);
  const clippings: KindleClipping[] = [];

  for (const entry of entries) {
    const lines = entry.split(/\r?\n/).filter((l, i, arr) => {
      // Keep all non-empty lines, plus single empty separator (line 3 of the
      // 4-line block). We trim leading/trailing empty lines below.
      return l.length > 0 || (i > 0 && i < arr.length - 1);
    });

    // Drop leading empties caused by the separator split.
    while (lines.length > 0 && lines[0].trim() === "") lines.shift();
    if (lines.length < 2) continue;

    const titleLine = lines[0];
    const headerLine = lines[1];
    // The text body is everything from index 2 onward, joined and trimmed.
    const text = lines
      .slice(2)
      .join("\n")
      .replace(/^\s+|\s+$/g, "");

    const { book, author } = parseTitleLine(titleLine);
    const { type, page, location, addedAt } = parseHeader(headerLine);

    if (!book) continue;
    clippings.push({ book, author, type, page, location, addedAt, text });
  }

  return clippings;
}
