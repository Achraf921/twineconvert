import { parseReferenceList } from "./reference-list";

/**
 * When a CSV -> citation conversion fails, the user has very often pasted
 * the wrong kind of input into the flagship csv-to-ris (and siblings):
 * a PubMed/MEDLINE export, or a plain-text reference list copied out of a
 * paper. PostHog showed both happening repeatedly. This inspects the raw
 * text and, if it recognises one of those shapes, returns a message that
 * points the user at the correct dedicated tool instead of a dead end.
 *
 * Call this ONLY after the CSV parse has already failed or produced zero
 * rows, so a normal (working) CSV is never second-guessed.
 */
export function citationInputHint(
  text: string,
  refTool: string,
  pubmedTool: string,
): string | null {
  // PubMed/MEDLINE tagged export: PMID- line plus other tagged fields.
  if (/(^|\n)\s*PMID- /.test(text) && /(^|\n)\s*(TI|AU|AB|JT|DP|SO)\s{1,2}- /.test(text)) {
    return `This looks like a PubMed/MEDLINE export, not a CSV. Try the ${pubmedTool} tool instead.`;
  }
  // Plain-text reference list. Require BOTH an unambiguous numbered marker
  // ([1] / 1. / (1) at a line start) AND a parsed entry carrying a year,
  // so a comma/quote-heavy data CSV (contacts, products) is never mistaken
  // for a bibliography. The real failing case in PostHog had [1]/[2].
  if (/(^|\n)\s*[[(]?\d+[)\].]\s+\S/.test(text)) {
    const refs = parseReferenceList(text);
    if (refs.length > 0 && refs.some((r) => r.year)) {
      return `This looks like a plain-text reference list, not a CSV. Try the ${refTool} tool instead.`;
    }
  }
  return null;
}
