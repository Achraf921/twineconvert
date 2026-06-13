/**
 * EndNote ENW (the "Refer"/tagged EndNote export) parser + writer for
 * the bibliography family. ENW is the format EndNote and most journal
 * databases offer behind a "Download .enw" / "Export to EndNote" link.
 * Each record is a block of `%X value` lines; %A repeats per author.
 *
 * Parses INTO and writes FROM the unified Citation model, so it composes
 * with every other citation format (BibTeX, RIS, NBIB, EndNote XML,
 * CSL-JSON, CSV) through the shared hub.
 *
 * Tag reference (Refer/EndNote):
 *   %0 reference type   %A author      %E editor       %T title
 *   %J journal          %B book title  %D year         %V volume
 *   %N issue            %P pages       %R DOI           %U URL
 *   %@ ISBN/ISSN        %I publisher   %C place         %K keyword
 *   %X abstract         %F label/key
 */

import type { Citation, CitationType } from "./citation";

const TYPE_IN: Record<string, CitationType> = {
  "journal article": "article",
  "book": "book",
  "edited book": "book",
  "book section": "incollection",
  "conference proceedings": "inproceedings",
  "conference paper": "inproceedings",
  "thesis": "thesis",
  "report": "report",
  "web page": "online",
  "electronic article": "article",
  "patent": "patent",
  "generic": "misc",
};

const TYPE_OUT: Record<CitationType, string> = {
  article: "Journal Article",
  book: "Book",
  inbook: "Book Section",
  incollection: "Book Section",
  inproceedings: "Conference Proceedings",
  thesis: "Thesis",
  report: "Report",
  manual: "Generic",
  misc: "Generic",
  online: "Web Page",
  patent: "Patent",
  audiovisual: "Generic",
};

interface RawEntry {
  tag: string;
  value: string;
}

function parseRecords(text: string): RawEntry[][] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const records: RawEntry[][] = [];
  let current: RawEntry[] | null = null;
  let last: RawEntry | null = null;
  for (const line of lines) {
    const m = /^%(.)[ \t]?(.*)$/.exec(line);
    if (m) {
      const tag = m[1];
      const value = m[2];
      // A new "%0" (reference type) starts a fresh record.
      if (tag === "0" && current && current.length > 0) {
        records.push(current);
        current = null;
      }
      if (!current) current = [];
      const entry = { tag, value: value.trim() };
      current.push(entry);
      last = entry;
    } else if (line.trim() === "") {
      last = null; // blank line ends any continuation
    } else if (last) {
      // Continuation of the previous tag's value (wrapped abstract etc.).
      last.value = `${last.value} ${line.trim()}`.trim();
    }
  }
  if (current && current.length > 0) records.push(current);
  return records;
}

function recordToCitation(entries: RawEntry[], idx: number): Citation {
  const authors: string[] = [];
  const editors: string[] = [];
  const keywords: string[] = [];
  const single: Record<string, string> = {};
  for (const { tag, value } of entries) {
    if (!value) continue;
    if (tag === "A") authors.push(value);
    else if (tag === "E") editors.push(value);
    else if (tag === "K") keywords.push(value);
    else if (single[tag] === undefined) single[tag] = value;
  }

  const typeRaw = (single["0"] ?? "").toLowerCase().trim();
  const type: CitationType = TYPE_IN[typeRaw] ?? "misc";

  const yearMatch = single["D"]?.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/);

  // %@ is ISBN or ISSN; ISSN is 4 digits, hyphen, 3 digits + check char.
  let isbn: string | undefined;
  let issn: string | undefined;
  if (single["@"]) {
    if (/^\d{4}-\d{3}[\dxX]$/.test(single["@"].trim())) issn = single["@"].trim();
    else isbn = single["@"].trim();
  }

  return {
    id: single["F"] || `enw-${idx}`,
    type,
    title: single["T"] || undefined,
    authors: authors.length > 0 ? authors : undefined,
    editors: editors.length > 0 ? editors : undefined,
    year: yearMatch ? yearMatch[1] : single["D"] || undefined,
    journal: single["J"] || undefined,
    booktitle: single["B"] || undefined,
    publisher: single["I"] || undefined,
    address: single["C"] || undefined,
    volume: single["V"] || undefined,
    issue: single["N"] || undefined,
    pages: single["P"] || undefined,
    doi: single["R"] || undefined,
    url: single["U"] || undefined,
    isbn,
    issn,
    abstract: single["X"] || undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
  };
}

export function parseEnw(text: string): Citation[] {
  return parseRecords(text)
    .map((rec, i) => recordToCitation(rec, i + 1))
    // Drop blocks that produced nothing meaningful (no type, title, or author).
    .filter((c) => c.title || c.authors || c.type !== "misc" || c.doi);
}

export function buildEnw(citations: Citation[]): string {
  const blocks: string[] = [];
  for (const c of citations) {
    const lines: string[] = [];
    lines.push(`%0 ${TYPE_OUT[c.type] ?? "Generic"}`);
    for (const a of c.authors ?? []) lines.push(`%A ${a}`);
    for (const e of c.editors ?? []) lines.push(`%E ${e}`);
    if (c.title) lines.push(`%T ${c.title}`);
    if (c.journal) lines.push(`%J ${c.journal}`);
    if (c.booktitle) lines.push(`%B ${c.booktitle}`);
    if (c.year) lines.push(`%D ${c.year}`);
    if (c.volume) lines.push(`%V ${c.volume}`);
    if (c.issue) lines.push(`%N ${c.issue}`);
    if (c.pages) lines.push(`%P ${c.pages}`);
    if (c.publisher) lines.push(`%I ${c.publisher}`);
    if (c.address) lines.push(`%C ${c.address}`);
    if (c.doi) lines.push(`%R ${c.doi}`);
    if (c.url) lines.push(`%U ${c.url}`);
    if (c.issn) lines.push(`%@ ${c.issn}`);
    else if (c.isbn) lines.push(`%@ ${c.isbn}`);
    for (const k of c.keywords ?? []) lines.push(`%K ${k}`);
    if (c.abstract) lines.push(`%X ${c.abstract}`);
    lines.push(`%F ${c.id}`);
    blocks.push(lines.join("\n"));
  }
  // Records are separated by a blank line; trailing newline for POSIX.
  return blocks.join("\n\n") + "\n";
}
