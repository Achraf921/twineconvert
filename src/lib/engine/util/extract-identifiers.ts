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

/** Validate an ISBN-10 or ISBN-13 by its check digit (separators removed). */
export function isValidIsbn(candidate: string): boolean {
  const s = candidate.toUpperCase().replace(/[^0-9X]/g, "");
  if (s.length === 10) {
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const ch = s[i];
      if (ch === "X" && i !== 9) return false;
      const d = ch === "X" ? 10 : Number(ch);
      if (Number.isNaN(d)) return false;
      sum += d * (10 - i);
    }
    return sum % 11 === 0;
  }
  if (s.length === 13) {
    if (!/^\d{13}$/.test(s)) return false;
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(s[i]) * (i % 2 ? 3 : 1);
    return sum % 10 === 0;
  }
  return false;
}

/** ISBNs: accepted only when "ISBN" labelled OR a bare 978/979 ISBN-13, and
 *  always validated by check digit, so phone numbers and random digit runs
 *  are not mistaken for ISBNs. Output is the separator-stripped form. */
export function extractIsbns(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(
    /ISBN(?:-1[03])?:?\s*((?:97[89][-\s]?)?[0-9][0-9\-\s]{7,16}[0-9Xx])/gi,
  )) {
    const c = m[1].replace(/[-\s]/g, "").toUpperCase();
    if (isValidIsbn(c)) out.push(c);
  }
  for (const m of text.matchAll(/\b(97[89](?:[-\s]?[0-9]){10})\b/g)) {
    const c = m[1].replace(/[-\s]/g, "");
    if (isValidIsbn(c)) out.push(c);
  }
  return dedupeKeepFirst(out);
}
