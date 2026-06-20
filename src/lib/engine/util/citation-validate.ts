/**
 * Check a citation library for entries that are missing the fields a given
 * reference type needs to be complete. This is the check researchers do by
 * hand before a submission: every journal article needs a journal, every book
 * needs a publisher, and so on. Deterministic (fixed required-field rules per
 * type), so the report is verifiable rather than a guess.
 */

import type { Citation, CitationType } from "./citation";

/** Required fields per reference type. Keyed by our Citation.type. */
const REQUIRED: Partial<Record<CitationType, string[]>> = {
  article: ["authors", "title", "journal", "year"],
  book: ["authors", "title", "publisher", "year"],
  inbook: ["authors", "title", "booktitle", "year"],
  incollection: ["authors", "title", "booktitle", "year"],
  inproceedings: ["authors", "title", "booktitle", "year"],
  thesis: ["authors", "title", "year"],
  report: ["authors", "title", "year"],
};

/** Fallback minimum for any type not in REQUIRED. */
const DEFAULT_REQUIRED = ["title", "year"];

function isMissing(c: Citation, field: string): boolean {
  if (field === "authors") return !c.authors || c.authors.length === 0;
  const v = (c as unknown as Record<string, unknown>)[field];
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

export interface EntryValidation {
  id: string;
  type: CitationType;
  missing: string[];
}

export function validateCitations(citations: Citation[]): EntryValidation[] {
  return citations.map((c) => {
    const required = REQUIRED[c.type] ?? DEFAULT_REQUIRED;
    return { id: c.id, type: c.type, missing: required.filter((f) => isMissing(c, f)) };
  });
}

/** Render a plain-text completeness report. */
export function buildValidationReport(results: EntryValidation[]): string {
  const total = results.length;
  const complete = results.filter((r) => r.missing.length === 0).length;
  const lines: string[] = [];
  lines.push(
    `Checked ${total} reference${total === 1 ? "" : "s"}: ${complete} complete, ${total - complete} with missing fields.`,
  );
  lines.push("");
  results.forEach((r, i) => {
    if (r.missing.length === 0) {
      lines.push(`[${i + 1}] ${r.id} (${r.type}): OK`);
    } else {
      lines.push(`[${i + 1}] ${r.id} (${r.type}): missing ${r.missing.join(", ")}`);
    }
  });
  return lines.join("\n") + "\n";
}
