/**
 * RIS / NBIB parser + writer.
 *
 * RIS records look like:
 *   TY  - JOUR
 *   AU  - Smith, John
 *   AU  - Doe, Jane
 *   TI  - A Paper About Things
 *   JO  - Nature
 *   PY  - 2024
 *   VL  - 123
 *   SP  - 45
 *   EP  - 67
 *   DO  - 10.1038/s41586-024-00001-0
 *   ER  -
 *
 * NBIB (PubMed format) is structurally identical to RIS but uses a
 * different tag dictionary (FAU instead of AU, TA instead of JO, etc.).
 * We accept both via a single tag-translation layer.
 */

import { type Citation, type CitationType, generateCitationKey } from "./citation";

const RIS_TYPE_MAP: Record<string, CitationType> = {
  JOUR: "article",
  EJOUR: "article",
  ABST: "article",
  BOOK: "book",
  CHAP: "inbook",
  CONF: "inproceedings",
  CPAPER: "inproceedings",
  THES: "thesis",
  RPRT: "report",
  STAT: "report",
  ELEC: "online",
  WEB: "online",
  PAT: "patent",
  AUDIO: "audiovisual",
  VIDEO: "audiovisual",
  GEN: "misc",
};

const REVERSE_TYPE_MAP: Record<CitationType, string> = {
  article: "JOUR",
  book: "BOOK",
  inbook: "CHAP",
  incollection: "CHAP",
  inproceedings: "CONF",
  thesis: "THES",
  report: "RPRT",
  manual: "RPRT",
  misc: "GEN",
  online: "ELEC",
  patent: "PAT",
  audiovisual: "AUDIO",
};

// NBIB (PubMed) tag → standard RIS tag. PubMed exports use a richer set;
// we map the common ones into RIS equivalents so the same parser handles both.
const NBIB_TO_RIS: Record<string, string> = {
  PT: "TY",
  TI: "TI",
  AU: "AU",
  FAU: "AU",
  AD: "AD",
  TA: "JO",
  JT: "T2",
  DP: "PY",
  VI: "VL",
  IP: "IS",
  PG: "SP",
  AB: "AB",
  AID: "DO",
  LID: "DO",
  ISSN: "SN",
  PMID: "ID",
};

export function parseRis(text: string): Citation[] {
  const citations: Citation[] = [];
  let current: Partial<Citation> & { _authors?: string[]; _keywords?: string[] } | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    // Lines look like "TY  - JOUR" — at least one space then "- " then value.
    const m = rawLine.match(/^([A-Z][A-Z0-9]{1,3})\s*-\s?(.*)$/);
    if (!m) continue;
    let tag = m[1];
    const value = m[2].trim();
    if (NBIB_TO_RIS[tag]) tag = NBIB_TO_RIS[tag];

    if (tag === "TY") {
      // New record
      current = { _authors: [], _keywords: [] };
      const ct = RIS_TYPE_MAP[value.toUpperCase()] ?? "misc";
      current.type = ct;
      continue;
    }
    if (tag === "ER") {
      if (current) {
        const authors = current._authors;
        const keywords = current._keywords;
        delete current._authors;
        delete current._keywords;
        const finalCitation: Citation = {
          id: current.id ?? generateCitationKey({ ...current, authors }),
          type: current.type ?? "misc",
          title: current.title,
          authors: authors && authors.length ? authors : undefined,
          year: current.year,
          journal: current.journal,
          publisher: current.publisher,
          address: current.address,
          volume: current.volume,
          issue: current.issue,
          pages: current.pages,
          doi: current.doi,
          url: current.url,
          isbn: current.isbn,
          issn: current.issn,
          abstract: current.abstract,
          keywords: keywords && keywords.length ? keywords : undefined,
        };
        citations.push(finalCitation);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    switch (tag) {
      case "AU":
      case "A1":
      case "A2":
        current._authors!.push(value);
        break;
      case "TI":
      case "T1":
        current.title = value;
        break;
      case "JO":
      case "JF":
      case "T2":
        current.journal = value;
        break;
      case "PY":
      case "Y1":
      case "DA":
        current.year = value.match(/\d{4}/)?.[0] ?? value;
        break;
      case "VL":
        current.volume = value;
        break;
      case "IS":
      case "CP":
        current.issue = value;
        break;
      case "SP":
        // Set start of page range; EP will append the end.
        current.pages = value;
        break;
      case "EP":
        current.pages = current.pages ? `${current.pages}-${value}` : value;
        break;
      case "PB":
        current.publisher = value;
        break;
      case "CY":
      case "AD":
        current.address = value;
        break;
      case "DO":
        current.doi = value.replace(/^doi:\s*/i, "");
        break;
      case "UR":
      case "L1":
        current.url = value;
        break;
      case "SN":
        // Could be ISSN or ISBN — heuristic: ISBNs are 10 or 13 digits, ISSNs are 8.
        if (/^\d{4}-?\d{3}[\dxX]$/.test(value)) current.issn = value;
        else current.isbn = value;
        break;
      case "AB":
      case "N2":
        current.abstract = value;
        break;
      case "KW":
        current._keywords!.push(value);
        break;
      case "ID":
        current.id = value;
        break;
    }
  }
  return citations;
}

export function buildRis(citations: Citation[]): string {
  const out: string[] = [];
  for (const c of citations) {
    const ty = REVERSE_TYPE_MAP[c.type] ?? "GEN";
    out.push(`TY  - ${ty}`);
    for (const a of c.authors ?? []) out.push(`AU  - ${a}`);
    if (c.title) out.push(`TI  - ${c.title}`);
    if (c.journal) out.push(`JO  - ${c.journal}`);
    if (c.year) out.push(`PY  - ${c.year}`);
    if (c.volume) out.push(`VL  - ${c.volume}`);
    if (c.issue) out.push(`IS  - ${c.issue}`);
    if (c.pages) {
      const [sp, ep] = c.pages.split(/-+/);
      if (sp) out.push(`SP  - ${sp}`);
      if (ep) out.push(`EP  - ${ep}`);
    }
    if (c.publisher) out.push(`PB  - ${c.publisher}`);
    if (c.address) out.push(`CY  - ${c.address}`);
    if (c.doi) out.push(`DO  - ${c.doi}`);
    if (c.url) out.push(`UR  - ${c.url}`);
    if (c.isbn) out.push(`SN  - ${c.isbn}`);
    if (c.issn) out.push(`SN  - ${c.issn}`);
    if (c.abstract) out.push(`AB  - ${c.abstract}`);
    for (const k of c.keywords ?? []) out.push(`KW  - ${k}`);
    out.push(`ER  - `);
    out.push("");
  }
  return out.join("\n");
}
