/**
 * CSV → Citation[] reader for the bibliography family. Reads the same
 * column layout that `citationsToCsv` writes, so round-trips work
 * cleanly. Tolerant of missing columns and extra whitespace.
 *
 * Header matching is case- and punctuation-insensitive and alias-aware,
 * so real-world exports work without renaming columns first. A PubMed
 * CSV (`Title`, `Authors`, `Publication Year`, `Journal/Book`, `DOI`),
 * a Zotero/Mendeley export (`Author`, `Publication Year`), and our own
 * lowercase round-trip format all resolve to the same fields. Without
 * this, a CSV whose headers are merely capitalised produced a RIS file
 * with empty records and no error (verified PostHog footgun on the
 * flagship csv-to-ris tool).
 */

import type { Citation, CitationType } from "./citation";

const CITATION_TYPES: CitationType[] = [
  "article", "book", "inbook", "incollection", "inproceedings",
  "thesis", "report", "manual", "misc", "online", "patent", "audiovisual",
];

/**
 * Canonical citation fields we read from a row, plus the synthetic
 * "date" column (parsed for a 4-digit year when no explicit year
 * column exists).
 */
type ReadableField =
  | "id" | "type" | "title" | "authors" | "editors" | "year" | "month"
  | "day" | "journal" | "booktitle" | "publisher" | "address" | "volume"
  | "issue" | "pages" | "doi" | "url" | "isbn" | "issn" | "abstract"
  | "keywords" | "date";

/**
 * Normalised header (lowercase, alphanumerics only) → canonical field.
 * Normalisation maps "Publication Year" → "publicationyear",
 * "Journal/Book" → "journalbook", "Author(s)" → "authors", etc.
 */
const FIELD_ALIASES: Record<string, ReadableField> = {
  // id
  id: "id", key: "id", citationkey: "id", citekey: "id", refid: "id", referenceid: "id",
  // type
  type: "type", entrytype: "type", referencetype: "type", itemtype: "type",
  // title (NOT bare "name" — too generic; matches contact/product CSVs)
  title: "title", titles: "title", articletitle: "title", primarytitle: "title",
  documenttitle: "title", papertitle: "title",
  // authors
  author: "authors", authors: "authors", authorname: "authors", authornames: "authors",
  fullauthornames: "authors", creator: "authors", creators: "authors", by: "authors",
  // editors
  editor: "editors", editors: "editors",
  // year / date
  year: "year", publicationyear: "year", pubyear: "year", yearpublished: "year",
  date: "date", publicationdate: "date", issued: "date", dateissued: "date",
  // month / day
  month: "month", day: "day",
  // journal / container
  journal: "journal", journaltitle: "journal", journalbook: "journal",
  journalname: "journal", source: "journal", publication: "journal",
  publicationtitle: "journal", secondarytitle: "journal", container: "journal",
  containertitle: "journal", periodical: "journal",
  // booktitle
  booktitle: "booktitle", book: "booktitle", bookname: "booktitle",
  // publisher / address
  publisher: "publisher", press: "publisher",
  address: "address", place: "address", location: "address", placepublished: "address",
  // volume / issue / pages
  volume: "volume", vol: "volume",
  issue: "issue", number: "issue", no: "issue", issuenumber: "issue",
  pages: "pages", page: "pages", pagerange: "pages", pp: "pages",
  // identifiers
  doi: "doi",
  url: "url", link: "url", weblink: "url", urls: "url", uri: "url",
  isbn: "isbn", isbn13: "isbn", isbn10: "isbn",
  issn: "issn", eissn: "issn",
  // abstract / keywords
  abstract: "abstract", abstractnote: "abstract", summary: "abstract",
  keywords: "keywords", keyword: "keywords", tags: "keywords", subject: "keywords",
};

/** Fields whose presence makes a CSV recognisably a citation table. */
const CONTENT_FIELDS: ReadableField[] = [
  "title", "authors", "editors", "year", "date", "journal", "booktitle",
  "publisher", "volume", "issue", "pages", "doi", "url", "isbn", "issn",
  "abstract", "keywords",
];

function normaliseHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function citationsFromCsv(text: string): Promise<Citation[]> {
  const Papa = (await import("papaparse")).default;

  // Strip a UTF-8 BOM and, critically, the Excel locale hint line that
  // many "Save as CSV" exports (especially non-US Excel) prepend:
  // `sep=;` or `sep=,` on the very first line. Left in place, papaparse
  // reads `sep=;` AS the header row, so every real column becomes
  // unrecognised and the conversion silently fails. We detect that line,
  // use its character as the delimiter, and drop it before parsing.
  let body = text.replace(/^﻿/, "");
  let delimiter: string | undefined;
  const sepMatch = body.match(/^sep=(.)\r?\n/i);
  if (sepMatch) {
    delimiter = sepMatch[1] === "\\t" ? "\t" : sepMatch[1];
    body = body.slice(sepMatch[0].length);
  }

  const parsed = Papa.parse<Record<string, string>>(body, {
    header: true,
    skipEmptyLines: true,
    ...(delimiter ? { delimiter } : {}),
  });

  // Resolve each canonical field to the FIRST CSV column that maps to
  // it. `parsed.meta.fields` holds the original header names in order.
  const fields = parsed.meta.fields ?? [];
  const resolved: Partial<Record<ReadableField, string>> = {};
  for (const header of fields) {
    const canonical = FIELD_ALIASES[normaliseHeader(header)];
    if (canonical && resolved[canonical] === undefined) {
      resolved[canonical] = header;
    }
  }

  // If the CSV has rows but not a single recognisable citation column,
  // fail loudly instead of emitting empty records. This is the case a
  // user hits when they upload a non-citation CSV, or an export whose
  // columns we genuinely don't know.
  const hasContentColumn = CONTENT_FIELDS.some((f) => resolved[f] !== undefined);
  if (parsed.data.length > 0 && !hasContentColumn) {
    throw new Error(
      `CSV has no recognizable citation columns (looked for title, author, year, journal, doi, and common aliases). Found columns: ${fields.join(", ") || "(none)"}.`,
    );
  }

  const get = (row: Record<string, string>, field: ReadableField): string | undefined => {
    const col = resolved[field];
    if (col === undefined) return undefined;
    const v = row[col];
    return v != null && String(v).trim() !== "" ? String(v).trim() : undefined;
  };

  const splitMulti = (s: string | undefined): string[] | undefined => {
    if (!s) return undefined;
    // Semicolon is the unambiguous multi-value separator (it never
    // appears inside a "Last, First" author name). Fall back to comma
    // only when there's no semicolon AND no "Last, First" comma pattern.
    const sep = s.includes(";") ? /\s*;\s*/ : /\s*,\s*/;
    if (sep.source.includes(",") && /\w,\s*\w/.test(s) && !/;/.test(s)) {
      // Ambiguous: a single "Last, First" name. Keep it whole.
      if ((s.match(/,/g) ?? []).length === 1) return [s.trim()];
    }
    const arr = s.split(sep).filter(Boolean);
    return arr.length > 0 ? arr : undefined;
  };

  const out: Citation[] = [];
  let idx = 0;
  for (const row of parsed.data) {
    idx++;
    if (!row || typeof row !== "object") continue;

    const id = (get(row, "id") || `cite-${idx}`).trim();
    const typeRaw = (get(row, "type") ?? "misc").toLowerCase() as CitationType;
    const type: CitationType = CITATION_TYPES.includes(typeRaw) ? typeRaw : "misc";

    // Year: explicit year column wins; otherwise pull the first 4-digit
    // run out of a date column ("2006-03-01" / "Mar 2006" → "2006").
    let year = get(row, "year");
    if (!year) {
      const date = get(row, "date");
      const m = date?.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/);
      if (m) year = m[1];
    }

    out.push({
      id,
      type,
      title: get(row, "title"),
      authors: splitMulti(get(row, "authors")),
      editors: splitMulti(get(row, "editors")),
      year,
      month: get(row, "month"),
      day: get(row, "day"),
      journal: get(row, "journal"),
      booktitle: get(row, "booktitle"),
      publisher: get(row, "publisher"),
      address: get(row, "address"),
      volume: get(row, "volume"),
      issue: get(row, "issue"),
      pages: get(row, "pages"),
      doi: get(row, "doi"),
      url: get(row, "url"),
      isbn: get(row, "isbn"),
      issn: get(row, "issn"),
      abstract: get(row, "abstract"),
      keywords: splitMulti(get(row, "keywords")),
    });
  }
  return out;
}
