/**
 * Pull citation identifiers out of a blob of free text (a pasted reference
 * section, a page of search results, an email). Researchers do this to batch
 * up DOIs/PMIDs for a lookup or an ILL request. Everything is matched with
 * conservative, label-anchored patterns so random numbers are not mistaken
 * for identifiers, and duplicates are removed (case-insensitively for DOIs)
 * while preserving first-seen order and original spelling.
 */

/** Dedupe by a lowercased key, keeping the first-seen original string. */
function dedupeKeepFirst(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** DOIs: "10." + registrant + "/" + suffix, with trailing punctuation trimmed. */
export function extractDois(text: string): string[] {
  const raw = (text.match(/10\.\d{4,9}\/[^\s"<>,;)\]}]+/g) ?? []).map((d) =>
    d.replace(/[.,;:)\]}]+$/, ""),
  );
  return dedupeKeepFirst(raw);
}

/** PubMed IDs: only the label-anchored "PMID: 12345678" form (a bare number
 *  out of context is not a reliable PMID). */
export function extractPmids(text: string): string[] {
  const raw = [...text.matchAll(/\bPMID:?\s*(\d{1,9})\b/gi)].map((m) => m[1]);
  return dedupeKeepFirst(raw);
}

/** arXiv IDs: new-style "2401.01234" (optional version) and old-style
 *  "math/0309136", each anchored by the "arXiv:" prefix. */
export function extractArxivIds(text: string): string[] {
  const raw = [...text.matchAll(/arXiv:\s*([a-z-]+\/\d{7}|\d{4}\.\d{4,5})(v\d+)?/gi)].map(
    (m) => m[1] + (m[2] ?? ""),
  );
  return dedupeKeepFirst(raw);
}
