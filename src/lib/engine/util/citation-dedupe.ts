/**
 * Deduplicate a Citation[] the way a reference manager does when you merge
 * libraries exported from several databases (PubMed + Scopus + Web of
 * Science routinely return the same paper). Two records are the same when
 * they share a DOI (case-insensitive), or, lacking a DOI, a normalized
 * title + year. The first occurrence wins; later duplicates are dropped.
 *
 * Returns the deduped list plus how many were removed, so a converter can
 * tell the user what happened.
 */

import type { Citation } from "./citation";

/** Lowercase, strip everything but alphanumerics, collapse whitespace. */
function normTitle(title: string | undefined): string {
  return (title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupeKey(c: Citation): string | null {
  if (c.doi) {
    const doi = c.doi.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").trim();
    if (doi) return `doi:${doi}`;
  }
  const t = normTitle(c.title);
  if (t) return `ti:${t}|${c.year ?? ""}`;
  return null; // no usable identity: never treat as a duplicate
}

export interface DedupeResult {
  citations: Citation[];
  removed: number;
}

export function dedupeCitations(citations: Citation[]): DedupeResult {
  const seen = new Set<string>();
  const out: Citation[] = [];
  let removed = 0;
  for (const c of citations) {
    const key = dedupeKey(c);
    if (key === null) {
      out.push(c);
      continue;
    }
    if (seen.has(key)) {
      removed++;
      continue;
    }
    seen.add(key);
    out.push(c);
  }
  return { citations: out, removed };
}
