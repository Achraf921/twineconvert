/**
 * CSV → Citation[] reader for the bibliography family. Reads the same
 * column layout that `citationsToCsv` writes, so round-trips work
 * cleanly. Tolerant of missing columns and extra whitespace.
 */

import type { Citation, CitationType } from "./citation";

const CITATION_TYPES: CitationType[] = [
  "article", "book", "inbook", "incollection", "inproceedings",
  "thesis", "report", "manual", "misc", "online", "patent", "audiovisual",
];

export async function citationsFromCsv(text: string): Promise<Citation[]> {
  const Papa = (await import("papaparse")).default;
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const out: Citation[] = [];
  let idx = 0;
  for (const row of parsed.data) {
    idx++;
    if (!row || typeof row !== "object") continue;
    const id = (row.id || `cite-${idx}`).trim();
    const typeRaw = (row.type ?? "misc").toLowerCase().trim() as CitationType;
    const type: CitationType = CITATION_TYPES.includes(typeRaw) ? typeRaw : "misc";

    const splitMulti = (s: string | undefined): string[] | undefined => {
      if (!s) return undefined;
      const arr = s.split(/\s*;\s*/).filter(Boolean);
      return arr.length > 0 ? arr : undefined;
    };

    out.push({
      id,
      type,
      title: row.title || undefined,
      authors: splitMulti(row.authors),
      editors: splitMulti(row.editors),
      year: row.year || undefined,
      journal: row.journal || undefined,
      booktitle: row.booktitle || undefined,
      publisher: row.publisher || undefined,
      volume: row.volume || undefined,
      issue: row.issue || undefined,
      pages: row.pages || undefined,
      doi: row.doi || undefined,
      url: row.url || undefined,
      isbn: row.isbn || undefined,
      issn: row.issn || undefined,
      abstract: row.abstract || undefined,
      keywords: splitMulti(row.keywords),
    });
  }
  return out;
}
