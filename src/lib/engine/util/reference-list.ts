/**
 * Best-effort parser for a plain-text reference list (a pasted
 * bibliography) into the unified Citation model. This exists because
 * PostHog showed users dropping numbered IEEE/APA reference lists onto
 * the csv-to-ris tool and failing: they have a "References" section from
 * a paper and want it in a reference manager.
 *
 * Free-text citation parsing is inherently fuzzy, so this is deliberately
 * conservative. It reliably extracts the import-critical fields (title,
 * year, DOI) and makes a good-faith attempt at authors for the two
 * dominant academic styles:
 *   IEEE:  [1] A. Smith, B. Jones, and C. Lee, "Title," Venue, 2024.
 *   APA:   Smith, J., Brown, K., & Lee, C. (2020). Title. Journal, 1(2).
 * A line is only emitted as a citation when a title (or author+year) is
 * found, so non-citation prose is skipped rather than turned into junk.
 */

import type { Citation, CitationType } from "./citation";

/** Split the blob into individual reference entries. */
function splitEntries(text: string): string[] {
  const t = text.replace(/\r\n?/g, "\n").trim();
  if (!t) return [];
  // Numbered markers ([1] / 1. / (1)) at the start of a line are the
  // most reliable delimiter and survive references that wrap lines.
  if (/^\s*[[(]?\d+[)\].]\s+/m.test(t)) {
    return t
      .split(/\n(?=\s*[[(]?\d+[)\].]\s+)/)
      .map((p) => p.replace(/^\s*[[(]?\d+[)\].]\s*/, "").replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);
  }
  // Otherwise a blank line between entries.
  if (/\n\s*\n/.test(t)) {
    return t.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  }
  // Fall back to one entry per line.
  return t.split(/\n/).map((l) => l.trim()).filter(Boolean);
}

const isInitials = (s: string) => /^(?:[A-Z]\.?[-\s]*){1,4}$/.test(s.trim());
const isSurname = (s: string) => /^[A-Z][A-Za-z'’-]+$/.test(s.trim());

/** Split a comma-separated author run, pairing APA "Surname, Initials". */
function splitCommaList(chunk: string): string[] {
  const tokens = chunk.split(/,\s*/).map((t) => t.trim()).filter(Boolean);
  // APA surname-first list: tokens alternate [surname, initials, ...].
  if (
    tokens.length >= 2 &&
    tokens.length % 2 === 0 &&
    tokens.every((t, i) => (i % 2 === 0 ? isSurname(t) : isInitials(t)))
  ) {
    const paired: string[] = [];
    for (let i = 0; i < tokens.length; i += 2) paired.push(`${tokens[i]}, ${tokens[i + 1]}`);
    return paired;
  }
  // IEEE initials-first comma list: each token is already one author.
  return tokens;
}

function parseAuthors(raw: string): string[] | undefined {
  let s = raw.replace(/\bet\s+al\.?/gi, "").replace(/[,;\s]+$/, "").trim();
  if (!s) return undefined;
  // Unify " and " / " & " (with optional preceding comma) into ";".
  s = s.replace(/\s*,?\s*(?:&|\band\b)\s*/gi, ";");
  const out: string[] = [];
  for (const chunk of s.split(/;+/).map((c) => c.trim()).filter(Boolean)) {
    if (/^[A-Z][A-Za-z'’-]+,\s*(?:[A-Z]\.?[-\s]*)+$/.test(chunk)) {
      out.push(chunk); // single "Surname, Initials"
    } else if (chunk.includes(",")) {
      out.push(...splitCommaList(chunk));
    } else {
      out.push(chunk);
    }
  }
  const cleaned = out
    .map((a) => a.replace(/[,;]+$/, "").trim())
    .filter((a) => a.length > 1 && /[A-Za-z]/.test(a));
  return cleaned.length ? cleaned : undefined;
}

function inferType(entry: string): CitationType {
  if (/\b(proc\.|proceedings|conf\.|conference|symposium|workshop|in\s+proc)/i.test(entry)) {
    return "inproceedings";
  }
  if (/\b(ed\.|edition|press|publishers?|publishing)\b/i.test(entry)) return "book";
  if (/\b(thesis|dissertation|ph\.?d\.?|master'?s)\b/i.test(entry)) return "thesis";
  return "article";
}

export function parseReferenceList(text: string): Citation[] {
  const out: Citation[] = [];
  let idx = 0;
  for (const entry of splitEntries(text)) {
    idx++;
    const ref: Citation = { id: `ref-${idx}`, type: "misc" };

    const doi = entry.match(/10\.\d{4,9}\/[^\s,;"'’)\]]+/);
    if (doi) ref.doi = doi[0].replace(/[.,;]+$/, "");

    const url = entry.match(/https?:\/\/[^\s,;)\]]+/);
    if (url) ref.url = url[0].replace(/[.,;]+$/, "");

    const year = entry.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/);
    if (year) ref.year = year[1];

    // Title: first quoted run (straight or curly quotes).
    let beforeTitle = "";
    const q = entry.match(/[“"]([^“”"]{4,})[”"]/);
    if (q) {
      ref.title = q[1].replace(/[.,]\s*$/, "").trim();
      beforeTitle = entry.slice(0, entry.indexOf(q[0]));
    } else {
      // APA: Authors (Year). Title. Rest...
      const apa = entry.match(/^(.*?)\(\s*(\d{4})\s*[a-z]?\s*\)\.\s*(.+?)\.\s/);
      if (apa) {
        beforeTitle = apa[1];
        ref.title = apa[3].trim();
        if (!ref.year) ref.year = apa[2];
      }
    }

    if (beforeTitle) ref.authors = parseAuthors(beforeTitle);
    if (ref.title || (ref.authors && ref.year)) {
      ref.type = inferType(entry);
      out.push(ref);
    }
  }
  return out;
}
