/**
 * RefWorks Tagged Format parser + writer for the bibliography family.
 * RefWorks (ProQuest) is the institutional reference manager many
 * university libraries provide; its "Tagged Format" export uses
 * two-letter tags (RT reference type, A1 author, T1 title, ...) with one
 * blank line between records.
 *
 * Parses INTO and writes FROM the unified Citation model, so it composes
 * with every other citation format in the hub.
 *
 * Tag reference (subset):
 *   RT type          A1 author       A2 editor       T1 title
 *   T2 journal/book  JF journal      YR year         FD date
 *   VO volume        IS issue        SP start page   OP other/end page
 *   DO DOI           UL URL          K1 keyword      AB abstract
 *   SN ISSN/ISBN     PB publisher    PP place        ID reference id
 */

import type { Citation, CitationType } from "./citation";

const TYPE_IN: Record<string, CitationType> = {
  "journal article": "article",
  "book, whole": "book",
  "book, section": "incollection",
  "book section": "incollection",
  "conference proceedings": "inproceedings",
  "dissertation/thesis": "thesis",
  "thesis": "thesis",
  "report": "report",
  "web page": "online",
  "generic": "misc",
};

const TYPE_OUT: Record<CitationType, string> = {
  article: "Journal Article",
  book: "Book, Whole",
  inbook: "Book, Section",
  incollection: "Book, Section",
  inproceedings: "Conference Proceedings",
  thesis: "Dissertation/Thesis",
  report: "Report",
  manual: "Generic",
  misc: "Generic",
  online: "Web Page",
  patent: "Generic",
  audiovisual: "Generic",
};

interface Raw {
  tag: string;
  value: string;
}

function parseRecords(text: string): Raw[][] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const records: Raw[][] = [];
  let current: Raw[] | null = null;
  let last: Raw | null = null;
  for (const line of lines) {
    const m = /^([A-Z][A-Z0-9]) (.*)$/.exec(line);
    if (m) {
      const tag = m[1];
      const value = m[2];
      // RT (reference type) opens a new record.
      if (tag === "RT" && current && current.length > 0) {
        records.push(current);
        current = null;
      }
      if (!current) current = [];
      const entry = { tag, value: value.trim() };
      current.push(entry);
      last = entry;
    } else if (line.trim() === "") {
      last = null;
    } else if (last) {
      last.value = `${last.value} ${line.trim()}`.trim();
    }
  }
  if (current && current.length > 0) records.push(current);
  return records;
}

function recordToCitation(entries: Raw[], idx: number): Citation {
  const authors: string[] = [];
  const editors: string[] = [];
  const keywords: string[] = [];
  const single: Record<string, string> = {};
  for (const { tag, value } of entries) {
    if (!value) continue;
    // A1/A2/K1 may carry several values separated by ";".
    if (tag === "A1") authors.push(...value.split(/\s*;\s*/).filter(Boolean));
    else if (tag === "A2") editors.push(...value.split(/\s*;\s*/).filter(Boolean));
    else if (tag === "K1") keywords.push(...value.split(/\s*;\s*/).filter(Boolean));
    else if (single[tag] === undefined) single[tag] = value;
  }

  const typeRaw = (single["RT"] ?? "").toLowerCase().trim();
  const type: CitationType = TYPE_IN[typeRaw] ?? "misc";

  const sp = single["SP"];
  const op = single["OP"];
  const pages = sp && op ? `${sp}-${op}` : sp || op || undefined;

  const yearMatch = (single["YR"] || single["FD"])?.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/);

  let isbn: string | undefined;
  let issn: string | undefined;
  if (single["SN"]) {
    if (/^\d{4}-\d{3}[\dxX]$/.test(single["SN"].trim())) issn = single["SN"].trim();
    else isbn = single["SN"].trim();
  }

  return {
    id: single["ID"] || `rw-${idx}`,
    type,
    title: single["T1"] || undefined,
    authors: authors.length > 0 ? authors : undefined,
    editors: editors.length > 0 ? editors : undefined,
    year: yearMatch ? yearMatch[1] : single["YR"] || undefined,
    journal: single["JF"] || single["JO"] || single["T2"] || undefined,
    booktitle: single["T2"] && (type === "incollection" || type === "inbook") ? single["T2"] : undefined,
    publisher: single["PB"] || undefined,
    address: single["PP"] || undefined,
    volume: single["VO"] || undefined,
    issue: single["IS"] || undefined,
    pages,
    doi: single["DO"] || undefined,
    url: single["UL"] || undefined,
    isbn,
    issn,
    abstract: single["AB"] || undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
  };
}

export function parseRefworks(text: string): Citation[] {
  return parseRecords(text)
    .map((rec, i) => recordToCitation(rec, i + 1))
    .filter((c) => c.title || c.authors || c.type !== "misc" || c.doi);
}

export function buildRefworks(citations: Citation[]): string {
  const blocks: string[] = [];
  for (const c of citations) {
    const lines: string[] = [];
    lines.push(`RT ${TYPE_OUT[c.type] ?? "Generic"}`);
    for (const a of c.authors ?? []) lines.push(`A1 ${a}`);
    for (const e of c.editors ?? []) lines.push(`A2 ${e}`);
    if (c.title) lines.push(`T1 ${c.title}`);
    if (c.journal) lines.push(`JF ${c.journal}`);
    if (c.booktitle) lines.push(`T2 ${c.booktitle}`);
    if (c.year) lines.push(`YR ${c.year}`);
    if (c.volume) lines.push(`VO ${c.volume}`);
    if (c.issue) lines.push(`IS ${c.issue}`);
    if (c.pages) {
      const [sp, op] = c.pages.split(/\s*[-–]\s*/);
      lines.push(`SP ${sp}`);
      if (op) lines.push(`OP ${op}`);
    }
    if (c.publisher) lines.push(`PB ${c.publisher}`);
    if (c.address) lines.push(`PP ${c.address}`);
    if (c.doi) lines.push(`DO ${c.doi}`);
    if (c.url) lines.push(`UL ${c.url}`);
    if (c.issn) lines.push(`SN ${c.issn}`);
    else if (c.isbn) lines.push(`SN ${c.isbn}`);
    for (const k of c.keywords ?? []) lines.push(`K1 ${k}`);
    if (c.abstract) lines.push(`AB ${c.abstract}`);
    lines.push(`ID ${c.id}`);
    blocks.push(lines.join("\n"));
  }
  return blocks.join("\n\n") + "\n";
}
