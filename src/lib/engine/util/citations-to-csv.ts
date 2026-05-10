/**
 * Shared CSV writer for the bibliography family. Picked the column set
 * that matches what reference managers (Zotero, Mendeley) export by
 * default, so users can pipe our output straight back into those tools.
 */

import type { Citation } from "./citation";

export async function citationsToCsv(citations: Citation[]): Promise<string> {
  const Papa = (await import("papaparse")).default;
  return Papa.unparse(
    citations.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title ?? "",
      authors: c.authors?.join("; ") ?? "",
      editors: c.editors?.join("; ") ?? "",
      year: c.year ?? "",
      journal: c.journal ?? "",
      booktitle: c.booktitle ?? "",
      publisher: c.publisher ?? "",
      volume: c.volume ?? "",
      issue: c.issue ?? "",
      pages: c.pages ?? "",
      doi: c.doi ?? "",
      url: c.url ?? "",
      isbn: c.isbn ?? "",
      issn: c.issn ?? "",
      abstract: c.abstract ?? "",
      keywords: c.keywords?.join("; ") ?? "",
    })),
  );
}
