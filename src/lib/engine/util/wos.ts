/**
 * Web of Science / ISI tagged-format parser for the bibliography family.
 * This is the "Plain Text" tagged export Web of Science (Clarivate) and
 * the older ISI produce, and the format VOSviewer, bibliometrix, and
 * CiteSpace consume. Each record is a block of two-letter-tag lines
 * terminated by an `ER` line; the file ends with `EF`.
 *
 * Parses INTO the unified Citation model so it composes with every other
 * citation format. It is an import-only format in practice (nobody hand-
 * authors WoS files), so there is no writer.
 *
 * Tag reference (subset we map):
 *   PT publication type   AU author (abbrev)  AF author (full)
 *   TI title              SO source/journal   PY year
 *   VL volume             IS issue            BP begin page
 *   EP end page           DI DOI              AB abstract
 *   DE author keywords    SN ISSN             BN ISBN
 *   PB publisher          UT accession id
 */

import type { Citation, CitationType } from "./citation";

const PT_TYPE: Record<string, CitationType> = {
  J: "article", // journal
  B: "book",
  S: "article", // book series
  P: "patent",
};

type RawRecord = Record<string, string[]>;

function parseRecords(text: string): RawRecord[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const records: RawRecord[] = [];
  let current: RawRecord | null = null;
  let lastTag: string | null = null;
  for (const line of lines) {
    if (/^ER(\s|$)/.test(line)) {
      if (current) records.push(current);
      current = null;
      lastTag = null;
      continue;
    }
    if (/^EF(\s|$)/.test(line)) break;
    const m = /^([A-Z0-9]{2}) (.*)$/.exec(line);
    if (m) {
      const tag = m[1];
      const val = m[2];
      if (tag === "FN" || tag === "VR") continue; // file header lines
      if (!current) current = {};
      (current[tag] ??= []).push(val);
      lastTag = tag;
    } else if (/^\s{2,}\S/.test(line) && current && lastTag) {
      // Indented continuation: another author (AU/AF) or wrapped text.
      (current[lastTag] ??= []).push(line.trim());
    }
  }
  if (current && Object.keys(current).length > 0) records.push(current);
  return records;
}

function recordToCitation(r: RawRecord, idx: number): Citation {
  const first = (tag: string): string | undefined => r[tag]?.[0]?.trim() || undefined;
  const joined = (tag: string): string | undefined =>
    r[tag] ? r[tag].map((s) => s.trim()).join(" ").trim() || undefined : undefined;

  const pt = first("PT")?.[0]?.toUpperCase() ?? "";
  const type: CitationType = PT_TYPE[pt] ?? "article";

  // Prefer the full author names (AF) over the abbreviated ones (AU).
  const authors = (r["AF"] && r["AF"].length > 0 ? r["AF"] : r["AU"])?.map((a) => a.trim());

  const bp = first("BP");
  const ep = first("EP");
  const pages = bp && ep ? `${bp}-${ep}` : bp || ep || undefined;

  const keywords = r["DE"]
    ? r["DE"].join(" ").split(/\s*;\s*/).map((k) => k.trim()).filter(Boolean)
    : undefined;

  return {
    id: first("UT") || `wos-${idx}`,
    type,
    title: joined("TI"),
    authors: authors && authors.length > 0 ? authors : undefined,
    year: first("PY"),
    journal: joined("SO"),
    publisher: first("PB"),
    volume: first("VL"),
    issue: first("IS"),
    pages,
    doi: first("DI"),
    issn: first("SN"),
    isbn: first("BN"),
    abstract: joined("AB"),
    keywords: keywords && keywords.length > 0 ? keywords : undefined,
  };
}

export function parseWos(text: string): Citation[] {
  return parseRecords(text)
    .map((r, i) => recordToCitation(r, i + 1))
    .filter((c) => c.title || c.authors);
}
