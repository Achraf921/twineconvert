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
//
// PT is handled separately (NOT in this map): in real PubMed exports, PT
// usually appears LATE in each record (after PMID, TI, AU, AB, etc.) and
// some records have multiple PT lines (Journal Article + Review). Treating
// PT as a record-start marker like TY drops every field before it and wipes
// records on each additional PT. See parseRis below for the actual handling.
const NBIB_TO_RIS: Record<string, string> = {
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

// PubMed Publication Type (PT) values are human-readable phrases. Map the
// common ones to citation types. Used only when the record has no TY tag
// already in play (RIS files take precedence over NBIB-derived type).
function pubMedPtToType(pt: string): CitationType | undefined {
  const v = pt.toLowerCase();
  if (v.includes("book") && v.includes("chapter")) return "inbook";
  if (v === "book" || /^book(\s|$)/.test(v)) return "book";
  if (v.includes("thesis") || v.includes("dissertation")) return "thesis";
  if (v.includes("patent")) return "patent";
  if (v.includes("conference") || v.includes("congress") || v.includes("proceedings")) return "inproceedings";
  if (v.includes("video") || v.includes("audio") || v.includes("audiovisual")) return "audiovisual";
  if (v.includes("report")) return "report";
  // Journal article, review, editorial, letter, comment, news, etc. all
  // serialize as "article" in our internal model.
  if (
    v.includes("journal article") ||
    v.includes("review") ||
    v.includes("editorial") ||
    v.includes("letter") ||
    v.includes("comment") ||
    v.includes("news")
  )
    return "article";
  return undefined;
}

type CurrentRecord = Partial<Citation> & {
  _authors: string[];
  _keywords: string[];
};

export function parseRis(text: string): Citation[] {
  const citations: Citation[] = [];
  let current: CurrentRecord | null = null;
  let lastTag: string | null = null;

  const ensureRecord = () => {
    if (!current) {
      current = { _authors: [], _keywords: [] };
    }
  };

  /**
   * Materialize the in-progress record into a Citation and push it. Called
   * on `ER` tag (RIS terminator), blank lines (NBIB convention), and at
   * end-of-file. Records with no meaningful content (e.g., trailing blank
   * lines or stray whitespace) are dropped rather than emitted as empty
   * citations.
   */
  const flushCurrent = () => {
    if (!current) return;
    const authors = current._authors;
    const keywords = current._keywords;
    const hasContent = !!(
      current.title ||
      current.id ||
      current.doi ||
      authors.length ||
      current.year ||
      current.journal ||
      current.abstract
    );
    if (!hasContent) {
      current = null;
      lastTag = null;
      return;
    }
    citations.push({
      id: current.id ?? generateCitationKey({ ...current, authors }),
      // Default to "article" rather than "misc": NBIB exports are
      // overwhelmingly journal articles, and PT may not have been
      // recognized (rare PubMed PT values).
      type: current.type ?? "article",
      title: current.title,
      authors: authors.length ? authors : undefined,
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
      keywords: keywords.length ? keywords : undefined,
    });
    current = null;
    lastTag = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    // Blank lines terminate records in NBIB; in RIS they're harmless
    // between/inside records and the ER tag is authoritative anyway.
    if (rawLine.trim() === "") {
      flushCurrent();
      continue;
    }

    // Lines look like "TY  - JOUR", at least one space then "- " then value.
    const m = rawLine.match(/^([A-Z][A-Z0-9]{1,3})\s*-\s?(.*)$/);
    if (!m) {
      // Continuation line for multi-line PubMed fields. PubMed wraps long
      // abstracts (and occasionally titles) onto indented continuation lines
      // with no tag. We append to whichever field was last written.
      //
      // Explicit widening cast: TypeScript's control-flow analyzer sees the
      // `current = null` mutation inside flushCurrent() and narrows `current`
      // to `never` here, even though the closure might not have run on this
      // iteration. The cast restores the declared union so the truthy check
      // narrows correctly.
      const rec = current as CurrentRecord | null;
      if (rec && lastTag && /^\s/.test(rawLine)) {
        const cont = rawLine.trim();
        if (cont) {
          if (lastTag === "AB" || lastTag === "N2") {
            rec.abstract = rec.abstract ? `${rec.abstract} ${cont}` : cont;
          } else if (lastTag === "TI" || lastTag === "T1") {
            rec.title = rec.title ? `${rec.title} ${cont}` : cont;
          } else if (lastTag === "JO" || lastTag === "JF" || lastTag === "T2") {
            rec.journal = rec.journal ? `${rec.journal} ${cont}` : cont;
          }
        }
      }
      continue;
    }

    let tag = m[1];
    const value = m[2].trim();

    // ER: explicit record terminator (RIS spec).
    if (tag === "ER") {
      flushCurrent();
      continue;
    }

    // TY: explicit record start (RIS spec). Flushes any record already in
    // progress (e.g., a previous NBIB record terminated only by a TY).
    if (tag === "TY") {
      flushCurrent();
      ensureRecord();
      current!.type = RIS_TYPE_MAP[value.toUpperCase()];
      lastTag = "TY";
      continue;
    }

    // PT: PubMed publication type. Sets type on the current record but does
    // NOT start a new record. Multiple PT lines per record are normal in
    // PubMed; the first recognized value wins.
    if (tag === "PT") {
      ensureRecord();
      if (!current!.type) {
        const ct = pubMedPtToType(value);
        if (ct) current!.type = ct;
      }
      lastTag = "PT";
      continue;
    }

    // Translate NBIB-specific tags to their RIS equivalents.
    if (NBIB_TO_RIS[tag]) tag = NBIB_TO_RIS[tag];

    // Implicit record start: any data-bearing tag with no active record
    // starts one. Real PubMed NBIB records begin with PMID (not PT), so
    // requiring an explicit type tag first would silently drop everything.
    ensureRecord();

    switch (tag) {
      case "AU":
      case "A1":
      case "A2":
        current!._authors.push(value);
        break;
      case "TI":
      case "T1":
        current!.title = value;
        break;
      case "JO":
      case "JF":
      case "T2":
        current!.journal = value;
        break;
      case "PY":
      case "Y1":
      case "DA":
        current!.year = value.match(/\d{4}/)?.[0] ?? value;
        break;
      case "VL":
        current!.volume = value;
        break;
      case "IS":
      case "CP":
        current!.issue = value;
        break;
      case "SP":
        // Set start of page range; EP will append the end. PubMed PG often
        // carries the full range already (e.g., "1499-1508").
        current!.pages = value;
        break;
      case "EP":
        current!.pages = current!.pages ? `${current!.pages}-${value}` : value;
        break;
      case "PB":
        current!.publisher = value;
        break;
      case "CY":
      case "AD":
        current!.address = value;
        break;
      case "DO": {
        // PubMed AID and LID lines carry a trailing kind tag like
        // "10.1038/foo [doi]", "PMC1234567 [pmc]", or "S0028-... [pii]".
        // Only the [doi]-tagged variant is a real DOI; [pmc] and [pii]
        // should be ignored, not stored as DOI.
        const taggedMatch = value.match(/^(.+?)\s*\[(doi|pii|pmc|pubmed)\]\s*$/i);
        if (taggedMatch) {
          const kind = taggedMatch[2].toLowerCase();
          if (kind === "doi") {
            current!.doi = taggedMatch[1].trim().replace(/^doi:\s*/i, "");
          }
        } else {
          current!.doi = value.replace(/^doi:\s*/i, "");
        }
        break;
      }
      case "UR":
      case "L1":
        current!.url = value;
        break;
      case "SN":
        // Could be ISSN or ISBN, heuristic: ISSNs are 8 digits (with
        // optional dash before the last 4 and an optional X check digit).
        if (/^\d{4}-?\d{3}[\dxX]$/.test(value)) current!.issn = value;
        else current!.isbn = value;
        break;
      case "AB":
      case "N2":
        current!.abstract = value;
        break;
      case "KW":
        current!._keywords.push(value);
        break;
      case "ID":
        current!.id = value;
        break;
    }
    lastTag = tag;
  }
  // PubMed NBIB exports often omit the trailing ER tag and rely on
  // blank-line separation between records. Flush any in-progress record
  // at end of input so we don't silently lose the last citation.
  flushCurrent();
  return citations;
}

// Citation type -> NBIB PT (Publication Type) value. PubMed uses
// human-readable phrases here, not abbreviations.
const NBIB_PT_MAP: Record<CitationType, string> = {
  article: "Journal Article",
  book: "Book",
  inbook: "Book Chapter",
  incollection: "Book Chapter",
  inproceedings: "Conference Paper",
  thesis: "Thesis",
  report: "Report",
  manual: "Report",
  misc: "General",
  online: "Web Resource",
  patent: "Patent",
  audiovisual: "Audiovisual Material",
};

/**
 * Serialize citations in NBIB (PubMed) tag format. Distinct from
 * buildRis() which uses RIS tags (TY, JO, PY, VL, IS, SP, EP, DO):
 * NBIB uses (PT, JT/TA, DP, VI, IP, PG, AID). The body content is
 * the same Citation objects; only the tag dictionary differs.
 *
 * Used by ris-to-nbib so the round-trip RIS -> NBIB -> RIS preserves
 * actual NBIB structure rather than just renaming the file.
 */
export function buildNbib(citations: Citation[]): string {
  const out: string[] = [];
  for (const c of citations) {
    // Numeric ids are most likely PMIDs (PubMed primary identifier).
    if (c.id && /^\d+$/.test(c.id)) {
      out.push(`PMID- ${c.id}`);
    }
    out.push(`PT  - ${NBIB_PT_MAP[c.type] ?? "General"}`);
    if (c.title) out.push(`TI  - ${c.title}`);
    for (const a of c.authors ?? []) out.push(`AU  - ${a}`);
    if (c.address) out.push(`AD  - ${c.address}`);
    if (c.journal) {
      // PubMed has both abbreviated (TA) and full (JT) journal titles;
      // we don't track the distinction so duplicate to both.
      out.push(`TA  - ${c.journal}`);
      out.push(`JT  - ${c.journal}`);
    }
    if (c.year) out.push(`DP  - ${c.year}`);
    if (c.volume) out.push(`VI  - ${c.volume}`);
    if (c.issue) out.push(`IP  - ${c.issue}`);
    if (c.pages) out.push(`PG  - ${c.pages}`);
    if (c.abstract) out.push(`AB  - ${c.abstract}`);
    // PubMed AID for DOIs always carries a "[doi]" trailing tag.
    if (c.doi) out.push(`AID - ${c.doi} [doi]`);
    if (c.issn) out.push(`IS  - ${c.issn}`);
    if (c.isbn) out.push(`ISBN- ${c.isbn}`);
    for (const k of c.keywords ?? []) out.push(`MH  - ${k}`);
    out.push(`ER  -`);
    out.push("");
  }
  return out.join("\n");
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
